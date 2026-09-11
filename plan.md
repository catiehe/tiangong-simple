# PRISM LCA — Plan

Single running plan for this repo. Supersedes the old `plan.md` (2026-09-07) and
`plan-0908.md` (2026-09-08), which are now folded in below as dated sections —
**do not create new plan-YYYYMMDD.md files going forward, keep appending here.**
Each section is marked with its status. See `WORKLOG.md` for the detailed
session-by-session log; this file is the forward-looking plan + a compressed
history of what shipped.

Status legend: ✅ done · 🚧 in progress · 🔜 not started

---

## 2026-09-07 — Initial scaffold ✅ done

A minimal clone of the sidebar/data-browsing shell from
[tiangong-lca-next](https://github.com/linancn/tiangong-lca-next), deployed as a
static site to GitHub Pages with Supabase as the only backend. Stack lifted from
[calvinw/product-graph-editor](https://github.com/calvinw/product-graph-editor):
React 19 + Vite 6 + TS + Tailwind v4 + shadcn/ui (`sidebar` block) + lucide-react
+ zustand + GitHub Actions Pages deploy, with `@supabase/supabase-js` added on
top.

Shipped: sidebar with 7 "Open Data" items (Models, Processes, Flows, Flow
Properties, Unit Groups, Sources, Contacts); one generic `datasets` table
(`type` + `payload` jsonb) with list/detail/add views shared across all 7 types;
magic-link auth gating the add form; `supabase/seed.sql` + `src/mock/datasets.json`
mock fallback; GitHub Actions deploy workflow. Live at
https://catiehe.github.io/tiangong-simple/.

## 2026-09-08 — Real auth + richer mock dataset ✅ done

1. **Magic-link auth, verified end to end.** Fixed `emailRedirectTo` to include
   the GH Pages base path (`window.location.origin + import.meta.env.BASE_URL`).
   User configured Supabase Auth's Site URL / Redirect URLs and confirmed a real
   emailed link signs in correctly, on both the Codespaces dev URL and the
   deployed site. Stretch fix done alongside: `dist/404.html` (copy of
   `index.html`) so GitHub Pages' no-rewrite behavior doesn't 404 direct links to
   non-root routes — `BrowserRouter` then handles it client-side.
2. **Richer mock dataset.** Expanded from 7 placeholder rows to 40
   cross-referenced rows (8 processes / 12 flows / 5 flow properties / 4 unit
   groups / 4 sources / 4 contacts / 3 models), ecoinvent/ILCD-style naming,
   including a full cotton t-shirt chain (fiber → weaving → dyeing → sewing →
   transport). `src/mock/datasets.json` and `supabase/seed.sql` kept byte-identical
   on ids/content. User ran the updated `seed.sql` against the live project;
   confirmed via REST that all 40 rows are live.

*(Note: between 2026-09-09 and 2026-09-10, per git history, a session not
recorded in this plan file added a structured Unit/Reference/Exchanges editor,
row Actions (View/Edit/Delete), and 18 more processes imported from lca-mcp
product graphs — bringing the mock dataset to 58 rows. Schema at that point was
still the flat `payload` shape below, not yet ILCD.)*

## 2026-09-11 — Adopt the real ILCD structure

The user shared a screenshot of the real TianGong app's "View process" modal
(`lca.tiangong.earth`) and asked to match tiangong-lca-next's actual data
structure — the ILCD (International Life Cycle Data) format — rather than the
flat `payload` shape used since 2026-09-07. Researched the real schema from
`linancn/tiangong-lca-next`'s `*_schema.json`/`demo.json`/form components for
all 6 non-Model sidebar types. Confirmed shared conventions across all of them:
a multi-language `{lang, text}` pattern for every label, a `{refObjectId, type,
shortDescription}` pattern for cross-dataset references, and common admin
metadata (`dataEntryBy`, `publicationAndOwnership`).

Scope decisions made with the user before starting:
- Skip the two large computed/workflow-output sections of Process (LCIA
  Results, the Validation review record) rather than build form UI for them —
  not something a person hand-authors.
- Roll out one type at a time, Process first, review before extending.

### Phase 1 — Process ✅ done (2026-09-11)

- `src/lib/ilcd.ts`: `LangText`, `DatasetRef`, `ProcessDataSet` types + a
  defensive `toProcessDataSet` normalizer (so partial/legacy payloads render
  instead of crashing).
- `src/components/ilcd/`: `LangTextField` (parallel English/简体中文 inputs),
  `DatasetRefField` (a `<Select>` sourced from `listDatasets()` of the target
  type, showing "(not found)" for an unresolved reference).
- `src/pages/ProcessForm.tsx` / `ProcessDetail.tsx`: 5-tab editor/viewer —
  Process information, Modelling and validation, Administrative information,
  Inputs and Outputs, Compliance declarations — matching the real app's tab
  layout minus the two skipped sections. `DatasetForm.tsx`/`DatasetDetail.tsx`
  dispatch to these for `type === "process"`; the other 6 types still use the
  original generic flat key/value editor, unchanged.
- Migrated all 26 existing process rows (`src/mock/datasets.json` +
  `supabase/seed.sql`) from the old flat exchange shape into the new one. The
  original 8 fully resolve against real Flow/Source records (with a starred
  reference-flow row); the 18 lca-mcp-imported ones mostly reference
  flows/sources that were never seeded as their own records — preserved as
  free-text `shortDescription` rather than fabricating fake links.
- Verified via a headless-Chromium smoke test (list, tabbed detail view,
  tabbed edit form) against both the mock-data fallback and the live Supabase
  project.

**⚠️ Outstanding action for the user:** the live Supabase project still has the
old flat exchange shape for `process` rows — **re-run the updated
`supabase/seed.sql`** in the Supabase SQL editor before the deployed site's
Processes will render correctly. Confirmed via testing that this is exactly
what's broken right now (process pages render mostly blank against live data
pre-reseed); the other 6 types are unaffected since their shape hasn't changed
yet.

### Phase 2 — Flow, Flow Property, Unit Group, Source, Contact ✅ done (2026-09-11)

Same treatment as Process, reusing `LangTextField` / `DatasetRefField` / the
normalizer pattern in `src/lib/ilcd.ts`. Built simplest-to-most-complex —
Contact → Source → Unit Group → Flow Property → Flow — each as a `*Form.tsx`/
`*Detail.tsx` pair (`ContactForm`/`ContactDetail`, `SourceForm`/`SourceDetail`,
`UnitGroupForm`/`UnitGroupDetail`, `FlowPropertyForm`/`FlowPropertyDetail`,
`FlowForm`/`FlowDetail`), dispatched from `DatasetForm.tsx`/`DatasetDetail.tsx`
the same way Process is. Extracted the inline `LangRow` display helper out of
`ProcessDetail.tsx` into `src/components/ilcd/lang-row.tsx` since all 6 detail
pages now need it. `src/lib/ilcd.ts` grew a `SharedAdministrativeInformation`
type (the dataEntryBy/publicationAndOwnership fields common to all 5 of these
types, since none of them have Process's commissioner/dataGenerator/copyright/
licenseType extras) plus defensive normalizers per type, same pattern as
Process's `normalizeExchanges`.

Migrated all existing mock/seed rows for these 5 types (4 contacts, 4 sources,
4 unit groups, 5 flow properties, 12 flows — 29 rows) into the new shapes.
Cross-references resolved cleanly since this data was already hand-authored to
be consistent: all 4 flow-property→unit-group refs and all 12 flow→flow-property
refs resolved; only one source→contact ref stayed unresolved (ISO 14040:2006's
publisher has no matching Contact record — correctly preserved as free text,
not fabricated). Verified via a headless-Chromium smoke test (list + detail for
all 5 types, zero console errors) against the mock-data fallback, and edit-form
rendering verified against a real Supabase-configured build (session gate
bypassed for the test only, reverted immediately after).

**Same outstanding action as Phase 1**: the live Supabase project needs
`supabase/seed.sql` re-run for these 5 types too, same as Process.

Per the 2026-09-11 schema research, the field-level shape per type:

- **Flow** (3 tabs: Flow information / Modelling and validation /
  Administrative information). Key structural piece: a repeatable
  `flowProperties[]` list — a flow can carry multiple properties (e.g. Mass +
  Net calorific value), each with a `meanValue` conversion factor and a
  `referenceToFlowPropertyDataSet` ref; `quantitativeReference` points at
  which entry is the flow's native/reference property. Also carries
  `CASNumber`/`sumFormula` (for elementary/substance flows) and a
  `typeOfDataSet` enum (Elementary / Product / Waste flow).
- **Flow Property** (3 tabs, simplest of the reference types): single
  `common:name` LangString, `referenceToReferenceUnitGroup` (ref to a Unit
  Group — this is what actually defines the property's unit).
- **Unit Group** (3 tabs + a `units[]` list): each unit row is `{name: plain
  string (not LangText, e.g. "kg"), meanValue: conversion factor relative to
  the reference unit}`; `referenceToReferenceUnit` is an int pointing at which
  unit row is the reference (factor 1.0).
- **Source** (2 tabs, closer to a citation record): `common:shortName`
  (display name), `sourceCitation` (free text), `publicationType` enum,
  `referenceToContact` (ref to a Contact), `referenceToDigitalFile`.
- **Contact** (2 tabs, closest to a plain address-book entry): `common:shortName`
  + `common:name`, `email`/`WWWAddress`/`telephone`/`contactAddress`,
  `referenceToContact[]` (repeatable — an org can link to its individual staff
  contacts).

**Model is explicitly excluded from this phase** — see Phase 3.

### Phase 3 — Model: external link + Edit + ILCD format ✅ done (2026-09-11)

Three separate asks, in order:

1. ✅ **Done.** Added a "Product Graph Editor" button on the Models list page
   (`DatasetList.tsx`, shown only when `typeInfo.type === "model"`), an
   external link to https://github.com/calvinw/product-graph-editor opening
   in a new tab. Verified with a headless-Chromium screenshot at both desktop
   and mobile widths.
2. ✅ **Done — turned out to already work, no new code needed.** Verified
   `/open-data/model/:id/edit` was already reachable and rendering correctly
   through the existing generic `DatasetForm` (Models never got a specialized
   form/detail pair in Phase 1-2, so it still uses the original flat
   name/description/key-value editor) — confirmed via a headless-Chromium
   test (session gate bypassed for the test only, reverted immediately after).
3. ✅ **Done.** Researched the real "Life Cycle Model" (`lifeCycleModelDataSet`)
   structure via a research fork, scoped to the document shape only — not the
   real app's visual X6Graph flowchart editor or its matrix-solving
   calculation engine, both explicitly out of scope. Key finding:
   `technology.processes.processInstance[]` is the graph — each instance
   references a real Process dataset (the same `DatasetRef` pattern already
   used everywhere) plus a `multiplicationFactor`; connections are declared
   only from the output side (`outputExchange.downstreamProcess`), and the
   model's own reference output (`quantitativeReference.referenceToReferenceProcess`)
   is a plain id pointing at one instance — exactly analogous to Process's
   `referenceToReferenceFlow`. `name`/`classification`/`generalComment` and
   the admin block reuse Process's exact shape (not the 5-type shared minimal
   admin). Built as `ModelDataSet` in `src/lib/ilcd.ts` (reusing
   `ProcessDataSet["administrativeInformation"]` via a type alias) with a
   4-tab `ModelForm.tsx`/`ModelDetail.tsx` pair: Model information, Modelling
   and validation, Administrative information, Process instances (a flat
   instance table + a `{fromInstanceId, toInstanceId}` connections table,
   instead of a drag-and-drop graph editor). `DatasetForm.tsx`/`DatasetDetail.tsx`
   simplified into pure type-dispatchers now that all 7 sidebar types have
   dedicated pages — the old generic flat key-value editor is gone entirely.
   Migrated all 3 existing Model mock/seed rows (each a linear process chain)
   into instance+connection lists; all process references resolved cleanly.
   Verified via headless-Chromium (list, detail with the starred reference
   process and connection table, edit form) — `tsc`/`build`/`lint` clean.
   **Phase 3 is now fully done.**

### Phase 4 — Import more real data via the lca-mcp MCP server 🔜 not started

Recap of how the existing 18 lca-mcp processes were imported (prior session,
not detailed in this plan file — per `WORKLOG.md` 2026-09-10 entry, "Add 18
processes from lca-mcp product graphs to seed data"): pulled from the lca-mcp
MCP server's bundled product graphs.

This phase extends that same import to the **other types**, using the MCP
tools available in this environment (`mcp__claude_ai_lca_new__*`):
`list_product_graphs` (bundled YAML product-graph catalog — each graph is a
named product system with its activities/exchanges), `search_database` /
`query_lca_database` / `get_lca_database_schema` (the underlying Brightway-backed
searchable SQLite projection: `activities`, `exchanges`, `exchange_details`
tables), `get_lca_activity_inputs` (one activity's direct exchanges).

What maps cleanly:
- **Models** — each product graph *is* a Model almost directly: a named
  product system referencing a list of processes, matching the existing
  `model.payload.processes` convention (or the new ILCD model format, once
  Phase 3 defines it).
- **Flows** — every exchange endpoint in a product graph is a flow; importing
  these as real Flow records is what actually resolves the ~31 currently
  free-text/unlinked flow names left over from the Phase 1 migration (see
  Phase 1's note above).

What needs a mapping heuristic, flagged explicitly rather than silently
invented (Brightway/lca-mcp's data model doesn't have these as first-class
concepts):
- **Flow Properties / Unit Groups** — Brightway exchanges carry a single unit
  string, not a property+unit-group breakdown. Plan: derive Unit Groups from
  the distinct set of units actually seen across imported exchanges (e.g. all
  mass-like units → one "Units of mass" group), and Flow Properties from a
  small fixed mapping (kg/g/t → Mass, MJ/kWh → Net calorific value, etc.) —
  same convention already used for the hand-authored 2026-09-08 mock rows.
- **Sources** — no direct equivalent; plan is to derive one Source per
  product graph from its LCIA method / database attribution (e.g. "TRACI
  v2.1", "bafu-linked"), similar to how `source` was already populated as a
  free-text field for the 18 existing lca-mcp processes.
- **Contacts** — no equivalent at all in the MCP data. Likely out of scope for
  this import, or a single generic "Imported via lca-mcp" contact — needs a
  decision when this phase starts, not decided yet.

This phase runs **after** Phase 2 and Phase 3, both because it depends on
those types having their ILCD-lite schemas defined (so import writes directly
into the final shape instead of needing a second migration), and because the
user asked for it last.

---

## Execution order (as requested 2026-09-11)

1. Phase 2 — Flow, Flow Property, Unit Group, Source, Contact ILCD formats ✅ done
2. Phase 3 — Model external link button, Model Edit, Model's own ILCD format ✅ done
3. Phase 4 — MCP-driven import extended to Models / Flows / Flow Properties /
   Sources / Unit Groups 🔜 next
