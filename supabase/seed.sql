-- Run in the Supabase SQL editor (or via `supabase db execute` / psql)
-- against your project. Safe to re-run: DDL uses IF NOT EXISTS, and the
-- sample rows use fixed ids with an upsert (`on conflict ... do update`),
-- so re-running always brings the sample rows up to date with this file
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

drop policy if exists "auth update" on datasets;
create policy "auth update" on datasets for update to authenticated using (true) with check (true);

drop policy if exists "auth delete" on datasets;
create policy "auth delete" on datasets for delete to authenticated using (true);

-- 40 sample rows, matching src/mock/datasets.json exactly: cross-referenced
-- flow properties, unit groups, flows, processes (including a full cotton
-- t-shirt chain: fiber -> weaving -> dyeing -> sewing -> transport), sources,
-- contacts, and models, so every sidebar item shows a small but connected
-- dataset immediately.
insert into datasets (id, type, name, description, payload, created_at) values
  ('44444444-4444-4444-4444-444444444444', 'flow_property', 'Mass', 'Standard mass flow property.', '{"unit_group": "Units of mass", "default_unit": "kg"}', '2026-01-05T10:00:00Z'),
  ('44444444-4444-4444-4444-444444444445', 'flow_property', 'Net calorific value', 'Lower heating value flow property, used for fuels and energy carriers.', '{"unit_group": "Units of energy", "default_unit": "MJ"}', '2026-01-05T10:01:00Z'),
  ('44444444-4444-4444-4444-444444444446', 'flow_property', 'Gross calorific value', 'Higher heating value flow property, used for fuels and energy carriers.', '{"unit_group": "Units of energy", "default_unit": "MJ"}', '2026-01-05T10:02:00Z'),
  ('44444444-4444-4444-4444-444444444447', 'flow_property', 'Transport service', 'Freight transport flow property, mass moved over distance.', '{"unit_group": "Units of transport service", "default_unit": "tkm"}', '2026-01-05T10:03:00Z'),
  ('44444444-4444-4444-4444-444444444448', 'flow_property', 'Volume', 'Standard volume flow property.', '{"unit_group": "Units of volume", "default_unit": "L"}', '2026-01-05T10:04:00Z'),

  ('55555555-5555-5555-5555-555555555555', 'unit_group', 'Units of mass', 'Mass-based units of measure.', '{"reference_unit": "kg", "units": ["kg", "g", "t"]}', '2026-01-05T10:10:00Z'),
  ('55555555-5555-5555-5555-555555555556', 'unit_group', 'Units of energy', 'Energy-based units of measure.', '{"reference_unit": "MJ", "units": ["MJ", "kWh", "GJ"]}', '2026-01-05T10:11:00Z'),
  ('55555555-5555-5555-5555-555555555557', 'unit_group', 'Units of transport service', 'Freight transport units of measure.', '{"reference_unit": "tkm", "units": ["tkm"]}', '2026-01-05T10:12:00Z'),
  ('55555555-5555-5555-5555-555555555558', 'unit_group', 'Units of volume', 'Volume-based units of measure.', '{"reference_unit": "L", "units": ["L", "m3"]}', '2026-01-05T10:13:00Z'),

  ('33333333-3333-3333-3333-333333333333', 'flow', 'Carbon dioxide, fossil', 'Elementary flow: fossil CO2 emission to air.', '{"flow_type": "elementary", "reference_flow_property": "Mass"}', '2026-01-05T10:20:00Z'),
  ('33333333-3333-3333-3333-333333333334', 'flow', 'Water, unspecified natural origin', 'Elementary flow: water withdrawn from the environment.', '{"flow_type": "elementary", "reference_flow_property": "Volume"}', '2026-01-05T10:21:00Z'),
  ('33333333-3333-3333-3333-333333333335', 'flow', 'Natural gas, high pressure', 'Product flow: natural gas delivered at high pressure.', '{"flow_type": "product", "reference_flow_property": "Net calorific value"}', '2026-01-05T10:22:00Z'),
  ('33333333-3333-3333-3333-333333333336', 'flow', 'Electricity, high voltage', 'Product flow: electricity supplied at high voltage.', '{"flow_type": "product", "reference_flow_property": "Net calorific value"}', '2026-01-05T10:23:00Z'),
  ('33333333-3333-3333-3333-333333333337', 'flow', 'Steel, low-alloyed', 'Product flow: low-alloyed steel.', '{"flow_type": "product", "reference_flow_property": "Mass"}', '2026-01-05T10:24:00Z'),
  ('33333333-3333-3333-3333-333333333338', 'flow', 'Cotton fiber, raw', 'Product flow: raw cotton fiber output of fiber production.', '{"flow_type": "product", "reference_flow_property": "Mass"}', '2026-01-05T10:25:00Z'),
  ('33333333-3333-3333-3333-333333333339', 'flow', 'Cotton fabric, woven', 'Product flow: woven, undyed cotton fabric.', '{"flow_type": "product", "reference_flow_property": "Mass"}', '2026-01-05T10:26:00Z'),
  ('3333333a-3333-3333-3333-33333333333a', 'flow', 'Cotton fabric, dyed', 'Product flow: dyed and finished cotton fabric.', '{"flow_type": "product", "reference_flow_property": "Mass"}', '2026-01-05T10:27:00Z'),
  ('3333333b-3333-3333-3333-33333333333b', 'flow', 'Cotton t-shirt', 'Product flow: finished, sewn cotton t-shirt.', '{"flow_type": "product", "reference_flow_property": "Mass"}', '2026-01-05T10:28:00Z'),
  ('3333333c-3333-3333-3333-33333333333c', 'flow', 'Dyestuff, reactive', 'Product flow: reactive dye used in textile dyeing.', '{"flow_type": "product", "reference_flow_property": "Mass"}', '2026-01-05T10:29:00Z'),
  ('3333333d-3333-3333-3333-33333333333d', 'flow', 'Wastewater, textile industry', 'Elementary flow: process wastewater discharged from textile dyeing.', '{"flow_type": "elementary", "reference_flow_property": "Volume"}', '2026-01-05T10:30:00Z'),
  ('3333333e-3333-3333-3333-33333333333e', 'flow', 'Transport, freight, lorry', 'Product flow: road freight transport service.', '{"flow_type": "product", "reference_flow_property": "Transport service"}', '2026-01-05T10:31:00Z'),

  ('22222222-2222-2222-2222-222222222222', 'process', 'Electricity, high voltage {CN}| production mix| Cut-off, U', 'China grid electricity production mix at high voltage.', '{"unit": "kWh", "reference_amount": 1, "source": "ecoinvent 3.10", "exchanges": [{"direction": "input", "flow": "Natural gas, high pressure", "amount": 0.18, "unit": "MJ"}, {"direction": "input", "flow": "Water, unspecified natural origin", "amount": 1.2, "unit": "L"}, {"direction": "output", "flow": "Electricity, high voltage", "amount": 1, "unit": "kWh"}, {"direction": "output", "flow": "Carbon dioxide, fossil", "amount": 0.55, "unit": "kg"}]}', '2026-01-05T10:40:00Z'),
  ('22222222-2222-2222-2222-222222222223', 'process', 'Natural gas, high pressure {RER}| production| Cut-off, U', 'European natural gas production and delivery at high pressure.', '{"unit": "MJ", "reference_amount": 1, "source": "ecoinvent 3.10", "exchanges": [{"direction": "output", "flow": "Natural gas, high pressure", "amount": 1, "unit": "MJ"}, {"direction": "output", "flow": "Carbon dioxide, fossil", "amount": 0.02, "unit": "kg"}]}', '2026-01-05T10:41:00Z'),
  ('22222222-2222-2222-2222-222222222224', 'process', 'Steel, low-alloyed {GLO}| production| Cut-off, U', 'Global average production of low-alloyed steel.', '{"unit": "kg", "reference_amount": 1, "source": "GaBi Professional database 2025", "exchanges": [{"direction": "input", "flow": "Electricity, high voltage", "amount": 0.6, "unit": "kWh"}, {"direction": "input", "flow": "Natural gas, high pressure", "amount": 8.5, "unit": "MJ"}, {"direction": "output", "flow": "Steel, low-alloyed", "amount": 1, "unit": "kg"}, {"direction": "output", "flow": "Carbon dioxide, fossil", "amount": 1.9, "unit": "kg"}]}', '2026-01-05T10:42:00Z'),
  ('22222222-2222-2222-2222-222222222225', 'process', 'Cotton fiber production {IN}| conventional, irrigated| Cut-off, U', 'Growing and harvesting irrigated conventional cotton fiber in India.', '{"unit": "kg", "reference_amount": 1, "source": "ecoinvent 3.10", "exchanges": [{"direction": "input", "flow": "Water, unspecified natural origin", "amount": 2700, "unit": "L"}, {"direction": "input", "flow": "Electricity, high voltage", "amount": 0.4, "unit": "kWh"}, {"direction": "output", "flow": "Cotton fiber, raw", "amount": 1, "unit": "kg"}, {"direction": "output", "flow": "Carbon dioxide, fossil", "amount": 1.8, "unit": "kg"}]}', '2026-01-05T10:43:00Z'),
  ('22222222-2222-2222-2222-222222222226', 'process', 'Weaving, cotton fabric {IN}| conventional| Cut-off, U', 'Weaving raw cotton fiber into undyed woven fabric.', '{"unit": "kg", "reference_amount": 1, "source": "Textile Exchange Preferred Fiber & Materials Report", "exchanges": [{"direction": "input", "flow": "Cotton fiber, raw", "amount": 1.05, "unit": "kg"}, {"direction": "input", "flow": "Electricity, high voltage", "amount": 0.3, "unit": "kWh"}, {"direction": "output", "flow": "Cotton fabric, woven", "amount": 1, "unit": "kg"}, {"direction": "output", "flow": "Carbon dioxide, fossil", "amount": 0.2, "unit": "kg"}]}', '2026-01-05T10:44:00Z'),
  ('22222222-2222-2222-2222-222222222227', 'process', 'Dyeing, cotton fabric {IN}| reactive dye, conventional| Cut-off, U', 'Dyeing and finishing woven cotton fabric with reactive dye.', '{"unit": "kg", "reference_amount": 1, "source": "Textile Exchange Preferred Fiber & Materials Report", "exchanges": [{"direction": "input", "flow": "Cotton fabric, woven", "amount": 1.02, "unit": "kg"}, {"direction": "input", "flow": "Dyestuff, reactive", "amount": 0.05, "unit": "kg"}, {"direction": "input", "flow": "Water, unspecified natural origin", "amount": 100, "unit": "L"}, {"direction": "input", "flow": "Electricity, high voltage", "amount": 0.5, "unit": "kWh"}, {"direction": "output", "flow": "Cotton fabric, dyed", "amount": 1, "unit": "kg"}, {"direction": "output", "flow": "Wastewater, textile industry", "amount": 95, "unit": "L"}]}', '2026-01-05T10:45:00Z'),
  ('22222222-2222-2222-2222-222222222228', 'process', 'Sewing, cotton t-shirt {IN}| conventional| Cut-off, U', 'Cutting and sewing dyed cotton fabric into a finished t-shirt.', '{"unit": "piece", "reference_amount": 1, "source": "Textile Exchange Preferred Fiber & Materials Report", "exchanges": [{"direction": "input", "flow": "Cotton fabric, dyed", "amount": 0.2, "unit": "kg"}, {"direction": "input", "flow": "Electricity, high voltage", "amount": 0.1, "unit": "kWh"}, {"direction": "output", "flow": "Cotton t-shirt", "amount": 1, "unit": "piece"}]}', '2026-01-05T10:46:00Z'),
  ('22222222-2222-2222-2222-222222222229', 'process', 'Transport, freight, lorry >32 metric ton, EURO6 {GLO}| market for| Cut-off, U', 'Global average heavy-duty road freight transport.', '{"unit": "tkm", "reference_amount": 1, "source": "ecoinvent 3.10", "exchanges": [{"direction": "output", "flow": "Transport, freight, lorry", "amount": 1, "unit": "tkm"}, {"direction": "output", "flow": "Carbon dioxide, fossil", "amount": 0.09, "unit": "kg"}]}', '2026-01-05T10:47:00Z'),

  ('66666666-6666-6666-6666-666666666666', 'source', 'ecoinvent 3.10', 'Background LCI database used for upstream processes.', '{"publisher": "ecoinvent Association", "year": 2026}', '2026-01-05T10:50:00Z'),
  ('66666666-6666-6666-6666-666666666667', 'source', 'GaBi Professional database 2025', 'Background LCI database used for industrial material processes.', '{"publisher": "Sphera", "year": 2025}', '2026-01-05T10:51:00Z'),
  ('66666666-6666-6666-6666-666666666668', 'source', 'ISO 14040:2006', 'Environmental management — Life cycle assessment — Principles and framework.', '{"publisher": "International Organization for Standardization", "year": 2006}', '2026-01-05T10:52:00Z'),
  ('66666666-6666-6666-6666-666666666669', 'source', 'Textile Exchange Preferred Fiber & Materials Report', 'Background data used for textile fiber, weaving, dyeing, and sewing processes.', '{"publisher": "Textile Exchange", "year": 2025}', '2026-01-05T10:53:00Z'),

  ('77777777-7777-7777-7777-777777777777', 'contact', 'Jane Smith', 'LCA practitioner maintaining this dataset.', '{"email": "jane.smith@example.com", "role": "Author"}', '2026-01-05T11:00:00Z'),
  ('77777777-7777-7777-7777-777777777778', 'contact', 'ecoinvent Association', 'Publisher and maintainer of the ecoinvent background database.', '{"email": "contact@ecoinvent.org", "role": "Data provider"}', '2026-01-05T11:01:00Z'),
  ('77777777-7777-7777-7777-777777777779', 'contact', 'Sphera Solutions', 'Publisher of the GaBi Professional background database.', '{"email": "info@sphera.com", "role": "Data provider"}', '2026-01-05T11:02:00Z'),
  ('7777777a-7777-7777-7777-77777777777a', 'contact', 'Textile Exchange', 'Publisher of textile fiber and materials background data.', '{"email": "info@textileexchange.org", "role": "Data provider"}', '2026-01-05T11:03:00Z'),

  ('11111111-1111-1111-1111-111111111111', 'model', 'Grid Electricity Supply Chain', 'Cradle-to-gate model of grid electricity, from natural gas extraction to delivery.', '{"processes": ["Natural gas, high pressure {RER}| production| Cut-off, U", "Electricity, high voltage {CN}| production mix| Cut-off, U"]}', '2026-01-05T11:10:00Z'),
  ('11111111-1111-1111-1111-111111111112', 'model', 'Steel Can Life Cycle', 'Cradle-to-gate model of a steel can, including upstream electricity and natural gas.', '{"processes": ["Natural gas, high pressure {RER}| production| Cut-off, U", "Electricity, high voltage {CN}| production mix| Cut-off, U", "Steel, low-alloyed {GLO}| production| Cut-off, U"]}', '2026-01-05T11:11:00Z'),
  ('11111111-1111-1111-1111-111111111113', 'model', 'Cotton T-Shirt Life Cycle', 'Cradle-to-gate model of a cotton t-shirt, from fiber production through sewing and distribution.', '{"processes": ["Cotton fiber production {IN}| conventional, irrigated| Cut-off, U", "Weaving, cotton fabric {IN}| conventional| Cut-off, U", "Dyeing, cotton fabric {IN}| reactive dye, conventional| Cut-off, U", "Sewing, cotton t-shirt {IN}| conventional| Cut-off, U", "Transport, freight, lorry >32 metric ton, EURO6 {GLO}| market for| Cut-off, U"]}', '2026-01-05T11:12:00Z')
on conflict (id) do update set
  type = excluded.type,
  name = excluded.name,
  description = excluded.description,
  payload = excluded.payload,
  created_at = excluded.created_at;
