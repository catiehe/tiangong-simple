# Work Log

## 2026-09-07
- Reviewed [tiangong-lca-next](https://github.com/linancn/tiangong-lca-next) to understand the source platform (UmiJS + Ant Design Pro + Supabase LCA authoring tool).
- Reviewed [calvinw/product-graph-editor](https://github.com/calvinw/product-graph-editor) as the stack to copy: React 19 + Vite 6 + TS + Tailwind v4 + shadcn/ui + GitHub Actions Pages deploy.
- Wrote `plan.md`: simplified TianGong LCA clone in this repo, GitHub Pages + Supabase, collapsible grouped sidebar (from a screenshot of the real app), `processes` table with mock dataset fallback, magic-link auth for writes.
- No app code scaffolded yet — next step is step 1 in `plan.md` (Vite/React/Tailwind/shadcn scaffold).
- Scope change: sidebar trimmed to a single "Open Data" group (dropped "My Data" for now), but expanded to all 7 items from the screenshot (Models, Processes, Flows, Flow Properties, Unit Groups, Sources, Contacts). Data model switched from a `processes`-only table to one generic `datasets` table (`type` + `payload` jsonb) so all 7 types share one list/detail/form implementation instead of 7 bespoke schemas.
