-- Ensure table exists
create table if not exists public.ifrc_challenges (
  id serial primary key,
  code text unique,
  name text not null
);

-- Upsert the five canonical challenges
insert into public.ifrc_challenges (code, name) values
  ('climate_environmental_crisis', 'Climate and environmental crisis'),
  ('evolving_crises_disasters', 'Evolving crisis and disasters'),
  ('growing_gaps_health_wellbeing', 'Growing gaps in health and well-being'),
  ('migration_identity', 'Migration and identity'),
  ('values_power_inclusion', 'Values, power and inclusion')
on conflict (code) do update set name = excluded.name;

-- Remove any rows not in the whitelist (safe cleanup)
delete from public.ifrc_challenges
where code not in (
  'climate_environmental_crisis',
  'evolving_crises_disasters',
  'growing_gaps_health_wellbeing',
  'migration_identity',
  'values_power_inclusion'
);
