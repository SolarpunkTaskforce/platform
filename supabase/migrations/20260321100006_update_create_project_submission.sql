-- Update create_project_submission RPC to accept owner_type and owner_id
--
-- CONTEXT:
-- The dual ownership model was introduced in 20260321100003_dual_ownership_model.sql
-- This migration updates the create_project_submission RPC function to accept owner_type and owner_id parameters
--
-- CHANGES:
-- 1) Drop existing create_project_submission function
-- 2) Create new version that accepts p_owner_type and p_owner_id parameters
-- 3) Set owner_type and owner_id when inserting into projects table

-- 1) Drop existing function
drop function if exists public.create_project_submission(
  text,
  text,
  uuid,
  double precision,
  double precision,
  text,
  text[],
  text,
  integer,
  date,
  date,
  text[],
  numeric,
  numeric,
  text,
  jsonb,
  uuid[],
  integer[],
  integer[]
);

-- 2) Create new function with owner_type and owner_id parameters
create or replace function public.create_project_submission(
  p_owner_type text,
  p_owner_id uuid,
  p_name text,
  p_description text,
  p_lead_org_id uuid,
  p_lat double precision,
  p_lng double precision,
  p_place_name text,
  p_type_of_intervention text[],
  p_target_demographic text,
  p_lives_improved integer,
  p_start_date date,
  p_end_date date,
  p_thematic_area text[],
  p_donations_received numeric,
  p_amount_needed numeric,
  p_currency text,
  p_links jsonb,
  p_partner_org_ids uuid[],
  p_sdg_ids integer[],
  p_ifrc_ids integer[]
)
returns table(id uuid, status text)
language plpgsql
set search_path = public, auth
as $$
declare
  new_project public.projects%rowtype;
  link_item jsonb;
begin
  insert into public.projects (
    owner_type,
    owner_id,
    name,
    description,
    lead_org_id,
    lat,
    lng,
    place_name,
    type_of_intervention,
    target_demographic,
    lives_improved,
    start_date,
    end_date,
    thematic_area,
    donations_received,
    amount_needed,
    currency
  )
  values (
    p_owner_type,
    p_owner_id,
    p_name,
    nullif(p_description, ''),
    p_lead_org_id,
    p_lat,
    p_lng,
    p_place_name,
    coalesce(p_type_of_intervention, array[]::text[]),
    nullif(p_target_demographic, ''),
    p_lives_improved,
    p_start_date,
    p_end_date,
    coalesce(p_thematic_area, array[]::text[]),
    p_donations_received,
    p_amount_needed,
    coalesce(nullif(p_currency, ''), 'USD')
  )
  returning * into new_project;

  if p_links is not null then
    for link_item in select * from jsonb_array_elements(p_links)
    loop
      if link_item ? 'url' then
        insert into public.project_links (project_id, url, label)
        values (
          new_project.id,
          link_item->>'url',
          nullif(link_item->>'label', '')
        );
      end if;
    end loop;
  end if;

  if coalesce(array_length(p_partner_org_ids, 1), 0) > 0 then
    insert into public.project_partners (project_id, organisation_id)
    select new_project.id, unnest(p_partner_org_ids);
  end if;

  if coalesce(array_length(p_sdg_ids, 1), 0) > 0 then
    insert into public.project_sdgs (project_id, sdg_id)
    select new_project.id, unnest(p_sdg_ids);
  end if;

  if coalesce(array_length(p_ifrc_ids, 1), 0) > 0 then
    insert into public.project_ifrc_challenges (project_id, challenge_id)
    select new_project.id, unnest(p_ifrc_ids);
  end if;

  return query select new_project.id, new_project.status;
end;
$$;

-- 3) Grant execute permissions to authenticated users
grant execute on function public.create_project_submission(
  text,
  uuid,
  text,
  text,
  uuid,
  double precision,
  double precision,
  text,
  text[],
  text,
  integer,
  date,
  date,
  text[],
  numeric,
  numeric,
  text,
  jsonb,
  uuid[],
  integer[],
  integer[]
) to authenticated;
