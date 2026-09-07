# TianGong LCA — Simple Version — Plan

A minimal clone of the sidebar/data-browsing shell from [tiangong-lca-next](https://github.com/linancn/tiangong-lca-next), built in **this repo**, deployed as a static site to **GitHub Pages**, with **Supabase** as the only backend (Postgres + Auth, no custom server).

Stack is lifted from [calvinw/product-graph-editor](https://github.com/calvinw/product-graph-editor) (same author's other GitHub Pages project), which is already set up exactly this way and known to work.

## Stack (from product-graph-editor)

- **React 19 + Vite 6 + TypeScript** — `npm run dev` / `npm run build`
- **Tailwind CSS v4** (`@tailwindcss/vite` plugin)
- **shadcn/ui** components (Radix-based, copied into `src/components/ui/`) — specifically the **`sidebar`** block, which natively supports collapsible grouped nav sections (exactly the shape in the screenshot: group header → expand/collapse → list of sub-items with icons)
- **lucide-react** for icons
- **zustand** for light client state (current dataset, sidebar state)
- `vite.config.ts` with `base: "./"` so the built app works under a GitHub Pages subpath
- **GitHub Actions** (`.github/workflows/deploy.yml`) — build on push to `main`, deploy `dist/` via `actions/configure-pages` + `actions/upload-pages-artifact` + `actions/deploy-pages` (copied near-verbatim from product-graph-editor)
- **`@supabase/supabase-js`** added on top — this is the one piece product-graph-editor doesn't have, since our app needs a real (if tiny) database

## Sidebar (the feature from the screenshot)

Built with shadcn's `Sidebar` / `SidebarGroup` / `SidebarMenu` components (collapsible pattern already available via the `collapsible.tsx` primitive product-graph-editor already uses).

**Scope (revised):** one group only for now — no "My Data" — but with the full item list from the screenshot:

- **Open Data** (expanded by default)
  - Models
  - Processes
  - Flows
  - Flow Properties
  - Unit Groups
  - Sources
  - Contacts

Commercial Data / Team Data / My Data groups are still out of scope. Auth is kept only for gating the "Add" action, not for a separate data scope — see Auth below.

Since Models/Flow Properties/Unit Groups/Sources/Contacts don't share Processes' shape (reference unit, exchanges), each item gets a **list + detail view using one shared generic component**, not seven bespoke schemas — see Data model.

## Data model (Supabase)

One generic table, `datasets`, with a `type` column matching the 7 sidebar items, and a `payload` jsonb for type-specific fields (Processes uses `unit`/`reference_amount`/`exchanges` inside `payload`; Contacts might use `email`/`role`; etc. — the UI just renders whatever keys are present):

```sql
create table datasets (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('model','process','flow','flow_property','unit_group','source','contact')),
  name text not null,
  description text,
  payload jsonb default '{}',    -- type-specific fields, e.g. for 'process': { unit, reference_amount, exchanges: [...] }
  created_by uuid references auth.users,
  created_at timestamptz default now()
);

alter table datasets enable row level security;
create policy "public read" on datasets for select using (true);
create policy "auth write" on datasets for insert to authenticated with check (true);
```

RLS: anyone can browse (`select`); only signed-in users can add new datasets (`insert`).

## Auth

Supabase magic-link (email-only) sign-in, shown in the sidebar footer — matches the account area in the top-right of the screenshot, simplified to fit the sidebar instead of a top bar. Gates the "Add" form only; all 7 Open Data lists are publicly viewable.

## Pages / routes

- `/` — redirects to `/open-data/processes`
- `/open-data/:type` — one generic list page (name + a couple of payload fields as columns) for each of the 7 types → click row → detail view rendering `payload` as key/value (Processes gets a nicer exchanges table since that shape is known)
- `/open-data/:type/new` — auth-gated generic "Add" form (name, description, and a small dynamic key/value editor for `payload`)
- `/sign-in` — magic-link form

## Mock dataset

- `supabase/seed.sql` — table DDL + RLS policies + **one sample row per type** (7 rows total) so every sidebar item shows something immediately. Run once in the Supabase SQL editor.
- `src/mock/datasets.json` — the same 7 rows, bundled locally as a fallback so `/open-data/:type` renders something even before Supabase env vars are set.

## Files to add (this repo, at root, alongside the existing devcontainer scaffolding)

```
src/
  main.tsx
  App.tsx                     -- router + SidebarProvider layout
  index.css                   -- Tailwind entry
  lib/
    supabase.ts                -- supabase client (reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
  state/
    session.ts                 -- zustand store: current auth session
  mock/
    datasets.json               -- 7 rows, one per type
  components/
    ui/                        -- shadcn primitives (sidebar, collapsible, table, button, input, card, ...)
    app-sidebar.tsx            -- the "Open Data" group with 7 items from the screenshot
  pages/
    DatasetList.tsx             -- generic, reads :type from the route
    DatasetDetail.tsx           -- generic; special-cases 'process' payload for a nicer exchanges table
    DatasetForm.tsx             -- generic add form, auth-gated
    SignIn.tsx
supabase/
  seed.sql
.github/workflows/deploy.yml
vite.config.ts
tailwind config (v4, via @tailwindcss/vite — no separate config file needed)
.env.example                  -- VITE_SUPABASE_URL=, VITE_SUPABASE_ANON_KEY=
package.json
```

## Build order

1. Scaffold Vite + React + TS + Tailwind v4, `vite.config.ts` with `base: "./"`
2. Add shadcn/ui (`sidebar`, `collapsible`, `table`, `card`, `button`, `input`, `label`, `dialog`) + lucide-react
3. Build `AppSidebar` (the "Open Data" group, 7 items) + router shell, wire up `/open-data/:type` as a route
4. Add `src/mock/datasets.json` (7 rows), render `DatasetList` / `DatasetDetail` from mock data (works with zero backend)
5. Add Supabase client + `.env.example`; swap `DatasetList`/`DatasetDetail` to read from Supabase when env vars are present, falling back to mock otherwise
6. Add Supabase Auth (magic link) + `SignIn` page + session store
7. Add `DatasetForm` (auth-gated insert) on `/open-data/:type/new`
8. Write `supabase/seed.sql` (DDL + RLS + 7 mock rows, one per type)
9. Copy `.github/workflows/deploy.yml` pattern from product-graph-editor, point at this repo
10. README: Supabase project setup, run `seed.sql`, set repo secrets (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) for the Actions build, enable Pages

## Open item

The Actions build needs `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` at build time (Vite inlines `import.meta.env.*` at build) — these should go in **GitHub Actions repo secrets**, not committed. I'll wire the workflow to read them from secrets in step 9; you'll need to add the actual values in the repo's Settings → Secrets once you have a Supabase project.
