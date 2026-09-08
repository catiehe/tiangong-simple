-- Run once in the Supabase SQL editor (or via `supabase db execute` / psql)
-- against a fresh project. Safe to re-run: DDL uses IF NOT EXISTS and the
-- sample rows use fixed ids, so re-running just no-ops on conflict.

create table if not exists datasets (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('model','process','flow','flow_property','unit_group','source','contact')),
  name text not null,
  description text,
  payload jsonb default '{}',
  created_by uuid references auth.users,
  created_at timestamptz default now()
);

alter table datasets enable row level security;

drop policy if exists "public read" on datasets;
create policy "public read" on datasets for select using (true);

drop policy if exists "auth write" on datasets;
create policy "auth write" on datasets for insert to authenticated with check (true);

-- One sample row per type, matching src/mock/datasets.json, so every
-- sidebar item shows something immediately.
insert into datasets (id, type, name, description, payload, created_at) values
  (
    '11111111-1111-1111-1111-111111111111',
    'model',
    'Cotton T-Shirt Life Cycle',
    'Cradle-to-grave model for a basic cotton t-shirt.',
    '{"stages": ["Fiber Production", "Weaving", "Dyeing", "Sewing", "Distribution", "Use", "End of Life"]}',
    '2026-01-05T10:00:00Z'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'process',
    'Cotton Fiber Production',
    'Growing and harvesting raw cotton fiber.',
    '{
      "unit": "kg",
      "reference_amount": 1,
      "exchanges": [
        {"direction": "input", "flow": "Water", "amount": 2700, "unit": "L"},
        {"direction": "input", "flow": "Fertilizer", "amount": 0.3, "unit": "kg"},
        {"direction": "output", "flow": "Raw Cotton Fiber", "amount": 1, "unit": "kg"},
        {"direction": "output", "flow": "CO2", "amount": 1.8, "unit": "kg"}
      ]
    }',
    '2026-01-05T10:05:00Z'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'flow',
    'Raw Cotton Fiber',
    'Unprocessed cotton fiber output flow.',
    '{"flow_type": "product", "reference_flow_property": "Mass"}',
    '2026-01-05T10:10:00Z'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'flow_property',
    'Mass',
    'Standard mass flow property.',
    '{"unit_group": "Units of mass", "default_unit": "kg"}',
    '2026-01-05T10:15:00Z'
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'unit_group',
    'Units of mass',
    'Mass-based units of measure.',
    '{"reference_unit": "kg", "units": ["kg", "g", "lb"]}',
    '2026-01-05T10:20:00Z'
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'source',
    'Ecoinvent 3.10',
    'Background LCI database used for upstream processes.',
    '{"publisher": "ecoinvent Association", "year": 2026}',
    '2026-01-05T10:25:00Z'
  ),
  (
    '77777777-7777-7777-7777-777777777777',
    'contact',
    'Jane Smith',
    'LCA practitioner maintaining this dataset.',
    '{"email": "jane.smith@example.com", "role": "Author"}',
    '2026-01-05T10:30:00Z'
  )
on conflict (id) do nothing;
