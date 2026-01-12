begin;

alter table public.organisations
  add column if not exists country_based text,
  add column if not exists based_in_country text,
  add column if not exists based_in_region text,
  add column if not exists what_we_do text,
  add column if not exists existing_since text,
  add column if not exists logo_url text,
  add column if not exists social_links jsonb,
  add column if not exists funding_needed numeric,
  add column if not exists founded_at date,
  add column if not exists thematic_tags text[],
  add column if not exists intervention_tags text[],
  add column if not exists demographic_tags text[],
  add column if not exists lat double precision,
  add column if not exists lng double precision;

create index if not exists organisations_based_in_country_idx
  on public.organisations (based_in_country);

create index if not exists organisations_based_in_region_idx
  on public.organisations (based_in_region);

create index if not exists organisations_funding_needed_idx
  on public.organisations (funding_needed);

create index if not exists organisations_founded_at_idx
  on public.organisations (founded_at);

create index if not exists organisations_thematic_tags_gin
  on public.organisations using gin (thematic_tags);

create index if not exists organisations_intervention_tags_gin
  on public.organisations using gin (intervention_tags);

create index if not exists organisations_demographic_tags_gin
  on public.organisations using gin (demographic_tags);

create index if not exists projects_lead_org_id_idx
  on public.projects (lead_org_id);

create index if not exists projects_lead_org_status_idx
  on public.projects (lead_org_id, status);

create index if not exists projects_lead_org_end_date_idx
  on public.projects (lead_org_id, end_date);

create or replace view public.organisations_directory_v1
with (security_invoker = true)
as
select
  o.id,
  o.name,
  coalesce(o.description, o.what_we_do) as description,
  o.website,
  coalesce(o.based_in_country, o.country_based, o.country) as based_in_country,
  o.based_in_region,
  o.thematic_tags,
  o.intervention_tags,
  o.demographic_tags,
  o.funding_needed,
  coalesce(o.founded_at, o.created_at::date) as founded_at,
  date_part('year', age(current_date, coalesce(o.founded_at, o.created_at::date)))::int as age_years,
  o.lat,
  o.lng,
  (
    select count(*)
    from public.follow_edges f
    where f.target_type = 'org' and f.target_org_id = o.id
  ) as followers_count,
  (
    select count(*)
    from public.projects p
    where p.lead_org_id = o.id
  ) as projects_total_count,
  (
    select count(*)
    from public.projects p
    where p.lead_org_id = o.id
      and (p.end_date is null or p.end_date >= current_date)
  ) as projects_ongoing_count
from public.organisations o;

grant select on public.organisations_directory_v1 to anon, authenticated;

commit;
