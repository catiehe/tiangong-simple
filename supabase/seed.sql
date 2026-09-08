-- Run in the Supabase SQL editor (or via `supabase db execute` / psql)
-- against your project. Safe to re-run: DDL uses IF NOT EXISTS, and the
-- sample rows use fixed ids with an upsert (`on conflict ... do update`),
-- so re-running always brings the 22 sample rows up to date with this file
-- rather than leaving stale duplicates or no-ops.

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

-- Sample rows, matching src/mock/datasets.json: 4 processes, 5 flows they
-- reference, 3 flow properties, 2 unit groups, 3 sources, 3 contacts, and
-- 2 models tying processes together, so every sidebar item shows a small
-- but cross-referenced dataset immediately.
insert into datasets (id, type, name, description, payload, created_at) values
  (
    '44444444-4444-4444-4444-444444444444',
    'flow_property',
    'Mass',
    'Standard mass flow property.',
    '{"unit_group": "Units of mass", "default_unit": "kg"}',
    '2026-01-05T10:00:00Z'
  ),
  (
    '44444444-4444-4444-4444-444444444445',
    'flow_property',
    'Net calorific value',
    'Lower heating value flow property, used for fuels and energy carriers.',
    '{"unit_group": "Units of energy", "default_unit": "MJ"}',
    '2026-01-05T10:01:00Z'
  ),
  (
    '44444444-4444-4444-4444-444444444446',
    'flow_property',
    'Gross calorific value',
    'Higher heating value flow property, used for fuels and energy carriers.',
    '{"unit_group": "Units of energy", "default_unit": "MJ"}',
    '2026-01-05T10:02:00Z'
  ),

  (
    '55555555-5555-5555-5555-555555555555',
    'unit_group',
    'Units of mass',
    'Mass-based units of measure.',
    '{"reference_unit": "kg", "units": ["kg", "g", "t"]}',
    '2026-01-05T10:10:00Z'
  ),
  (
    '55555555-5555-5555-5555-555555555556',
    'unit_group',
    'Units of energy',
    'Energy-based units of measure.',
    '{"reference_unit": "MJ", "units": ["MJ", "kWh", "GJ"]}',
    '2026-01-05T10:11:00Z'
  ),

  (
    '33333333-3333-3333-3333-333333333333',
    'flow',
    'Carbon dioxide, fossil',
    'Elementary flow: fossil CO2 emission to air.',
    '{"flow_type": "elementary", "reference_flow_property": "Mass"}',
    '2026-01-05T10:20:00Z'
  ),
  (
    '33333333-3333-3333-3333-333333333334',
    'flow',
    'Water, unspecified natural origin',
    'Elementary flow: water withdrawn from the environment.',
    '{"flow_type": "elementary", "reference_flow_property": "Mass"}',
    '2026-01-05T10:21:00Z'
  ),
  (
    '33333333-3333-3333-3333-333333333335',
    'flow',
    'Natural gas, high pressure',
    'Product flow: natural gas delivered at high pressure.',
    '{"flow_type": "product", "reference_flow_property": "Net calorific value"}',
    '2026-01-05T10:22:00Z'
  ),
  (
    '33333333-3333-3333-3333-333333333336',
    'flow',
    'Electricity, high voltage',
    'Product flow: electricity supplied at high voltage.',
    '{"flow_type": "product", "reference_flow_property": "Net calorific value"}',
    '2026-01-05T10:23:00Z'
  ),
  (
    '33333333-3333-3333-3333-333333333337',
    'flow',
    'Steel, low-alloyed',
    'Product flow: low-alloyed steel.',
    '{"flow_type": "product", "reference_flow_property": "Mass"}',
    '2026-01-05T10:24:00Z'
  ),

  (
    '22222222-2222-2222-2222-222222222222',
    'process',
    'Electricity, high voltage {CN}| production mix| Cut-off, U',
    'China grid electricity production mix at high voltage.',
    '{
      "unit": "kWh",
      "reference_amount": 1,
      "source": "ecoinvent 3.10",
      "exchanges": [
        {"direction": "input", "flow": "Natural gas, high pressure", "amount": 0.18, "unit": "MJ"},
        {"direction": "input", "flow": "Water, unspecified natural origin", "amount": 1.2, "unit": "L"},
        {"direction": "output", "flow": "Electricity, high voltage", "amount": 1, "unit": "kWh"},
        {"direction": "output", "flow": "Carbon dioxide, fossil", "amount": 0.55, "unit": "kg"}
      ]
    }',
    '2026-01-05T10:30:00Z'
  ),
  (
    '22222222-2222-2222-2222-222222222223',
    'process',
    'Natural gas, high pressure {RER}| production| Cut-off, U',
    'European natural gas production and delivery at high pressure.',
    '{
      "unit": "MJ",
      "reference_amount": 1,
      "source": "ecoinvent 3.10",
      "exchanges": [
        {"direction": "output", "flow": "Natural gas, high pressure", "amount": 1, "unit": "MJ"},
        {"direction": "output", "flow": "Carbon dioxide, fossil", "amount": 0.02, "unit": "kg"}
      ]
    }',
    '2026-01-05T10:31:00Z'
  ),
  (
    '22222222-2222-2222-2222-222222222224',
    'process',
    'Steel, low-alloyed {GLO}| production| Cut-off, U',
    'Global average production of low-alloyed steel.',
    '{
      "unit": "kg",
      "reference_amount": 1,
      "source": "GaBi Professional database 2025",
      "exchanges": [
        {"direction": "input", "flow": "Electricity, high voltage", "amount": 0.6, "unit": "kWh"},
        {"direction": "input", "flow": "Natural gas, high pressure", "amount": 8.5, "unit": "MJ"},
        {"direction": "output", "flow": "Steel, low-alloyed", "amount": 1, "unit": "kg"},
        {"direction": "output", "flow": "Carbon dioxide, fossil", "amount": 1.9, "unit": "kg"}
      ]
    }',
    '2026-01-05T10:32:00Z'
  ),
  (
    '22222222-2222-2222-2222-222222222225',
    'process',
    'Cotton fiber production {IN}| conventional, irrigated| Cut-off, U',
    'Growing and harvesting irrigated conventional cotton fiber in India.',
    '{
      "unit": "kg",
      "reference_amount": 1,
      "source": "ecoinvent 3.10",
      "exchanges": [
        {"direction": "input", "flow": "Water, unspecified natural origin", "amount": 2700, "unit": "L"},
        {"direction": "input", "flow": "Electricity, high voltage", "amount": 0.4, "unit": "kWh"},
        {"direction": "output", "flow": "Carbon dioxide, fossil", "amount": 1.8, "unit": "kg"}
      ]
    }',
    '2026-01-05T10:33:00Z'
  ),

  (
    '66666666-6666-6666-6666-666666666666',
    'source',
    'ecoinvent 3.10',
    'Background LCI database used for upstream processes.',
    '{"publisher": "ecoinvent Association", "year": 2026}',
    '2026-01-05T10:40:00Z'
  ),
  (
    '66666666-6666-6666-6666-666666666667',
    'source',
    'GaBi Professional database 2025',
    'Background LCI database used for industrial material processes.',
    '{"publisher": "Sphera", "year": 2025}',
    '2026-01-05T10:41:00Z'
  ),
  (
    '66666666-6666-6666-6666-666666666668',
    'source',
    'ISO 14040:2006',
    'Environmental management -- Life cycle assessment -- Principles and framework.',
    '{"publisher": "International Organization for Standardization", "year": 2006}',
    '2026-01-05T10:42:00Z'
  ),

  (
    '77777777-7777-7777-7777-777777777777',
    'contact',
    'Jane Smith',
    'LCA practitioner maintaining this dataset.',
    '{"email": "jane.smith@example.com", "role": "Author"}',
    '2026-01-05T10:50:00Z'
  ),
  (
    '77777777-7777-7777-7777-777777777778',
    'contact',
    'ecoinvent Association',
    'Publisher and maintainer of the ecoinvent background database.',
    '{"email": "contact@ecoinvent.org", "role": "Data provider"}',
    '2026-01-05T10:51:00Z'
  ),
  (
    '77777777-7777-7777-7777-777777777779',
    'contact',
    'Sphera Solutions',
    'Publisher of the GaBi Professional background database.',
    '{"email": "info@sphera.com", "role": "Data provider"}',
    '2026-01-05T10:52:00Z'
  ),

  (
    '11111111-1111-1111-1111-111111111111',
    'model',
    'Grid Electricity Supply Chain',
    'Cradle-to-gate model of grid electricity, from natural gas extraction to delivery.',
    '{"processes": ["Natural gas, high pressure {RER}| production| Cut-off, U", "Electricity, high voltage {CN}| production mix| Cut-off, U"]}',
    '2026-01-05T11:00:00Z'
  ),
  (
    '11111111-1111-1111-1111-111111111112',
    'model',
    'Steel Can Life Cycle',
    'Cradle-to-gate model of a steel can, including upstream electricity and natural gas.',
    '{"processes": ["Natural gas, high pressure {RER}| production| Cut-off, U", "Electricity, high voltage {CN}| production mix| Cut-off, U", "Steel, low-alloyed {GLO}| production| Cut-off, U"]}',
    '2026-01-05T11:01:00Z'
  )
on conflict (id) do update set
  type = excluded.type,
  name = excluded.name,
  description = excluded.description,
  payload = excluded.payload,
  created_at = excluded.created_at;
