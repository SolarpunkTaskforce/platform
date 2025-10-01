-- FILE: supabase/migrations/20250905120000_projects_extended.sql
begin;

-- Ensure organisations table exists
create table if not exists public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

-- Base projects table (text status with check)
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  lead_org_id uuid references public.organisations(id),
  lat double precision,
  lng double precision,
  place_name text,
  type_of_intervention text[],
  target_demographic text,
  lives_improved integer,
  start_date date,
  end_date date,
  thematic_area text[],
  donations_received numeric,
  amount_needed numeric,
  currency text default 'USD',
  status text default 'pending' check (status in ('pending','approved','rejected')),
  created_by uuid default auth.uid(),
  created_at timestamptz default now()
);

-- Drop policies that may reference status before any status changes
drop policy if exists "projects_public_read_approved"    on public.projects;
drop policy if exists "projects_read_admin_all"          on public.projects;
drop policy if exists "projects_read_own_pending"        on public.projects;
drop policy if exists "projects_update_admin_moderation" on public.projects;
drop policy if exists "projects_update_own_pending"      on public.projects;
drop policy if exists "projects_insert_auth"             on public.projects;
drop policy if exists "projects_select"                  on public.projects;
drop policy if exists "projects_insert"                  on public.projects;
drop policy if exists "projects_update_owner"            on public.projects;
drop policy if exists "projects_update_admin"            on public.projects;
drop policy if exists "projects_delete_owner"            on public.projects;
drop policy if exists "projects_delete_admin"            on public.projects;

-- Drop dependent views/rules that reference projects.status
drop view if exists public.rejected_projects;

-- Column renames/additions/normalisation
do $$
begin
  -- title -> name
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='title')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='name') then
    alter table public.projects rename column title to name;
  end if;

  -- ensure name exists and is NOT NULL
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='name') then
    alter table public.projects add column name text;
  end if;
  update public.projects set name = coalesce(name, 'Untitled project') where name is null;
  alter table public.projects alter column name set not null;

  -- handle status/approval_status consolidation (keep status as text with check)
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='status')
     and exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='approval_status') then
    alter table public.projects rename column status to lifecycle_status;
  end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='approval_status') then
    alter table public.projects rename column approval_status to status;
    alter table public.projects alter column status type text using status::text;
  end if;

  -- ensure default/check on status (safe now that views/policies are dropped)
  begin
    alter table public.projects drop constraint projects_status_check;
  exception when undefined_object then
    -- no-op
  end;
  alter table public.projects alter column status set default 'pending';
  alter table public.projects add constraint projects_status_check check (status in ('pending','approved','rejected'));

  -- funding_needed -> amount_needed
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='funding_needed')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='amount_needed') then
    alter table public.projects rename column funding_needed to amount_needed;
  end if;

  -- ensure additional columns
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='description') then
    alter table public.projects add column description text;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='lead_org_id') then
    alter table public.projects add column lead_org_id uuid references public.organisations(id);
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='lat') then
    alter table public.projects add column lat double precision;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='lng') then
    alter table public.projects add column lng double precision;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='place_name') then
    alter table public.projects add column place_name text;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='type_of_intervention') then
    alter table public.projects add column type_of_intervention text[];
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='target_demographic') then
    alter table public.projects add column target_demographic text;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='lives_improved') then
    alter table public.projects add column lives_improved integer;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='start_date') then
    alter table public.projects add column start_date date;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='end_date') then
    alter table public.projects add column end_date date;
  end if;

  -- thematic_area ensure text[]
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='thematic_area') then
    if (select data_type from information_schema.columns where table_schema='public' and table_name='projects' and column_name='thematic_area') <> 'ARRAY' then
      alter table public.projects alter column thematic_area type text[] using array[thematic_area];
    end if;
  else
    alter table public.projects add column thematic_area text[];
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='donations_received') then
    alter table public.projects add column donations_received numeric;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='amount_needed') then
    alter table public.projects add column amount_needed numeric;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='currency') then
    alter table public.projects add column currency text default 'USD';
  end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='created_by') then
    alter table public.projects alter column created_by set default auth.uid();
  else
    alter table public.projects add column created_by uuid default auth.uid();
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='created_at') then
    alter table public.projects add column created_at timestamptz default now();
  end if;
end$$;

-- Child/lookup tables
create table if not exists public.project_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  url text not null,
  label text,
  created_at timestamptz default now()
);

create table if not exists public.project_partners (
  project_id uuid references public.projects(id) on delete cascade,
  organisation_id uuid references public.organisations(id) on delete cascade,
  primary key (project_id, organisation_id)
);

create table if not exists public.sdgs (
  id int primary key,
  name text not null
);
insert into public.sdgs (id, name) values
  (1, 'No Poverty'),
  (2, 'Zero Hunger'),
  (3, 'Good Health and Well-being'),
  (4, 'Quality Education'),
  (5, 'Gender Equality'),
  (6, 'Clean Water and Sanitation'),
  (7, 'Affordable and Clean Energy'),
  (8, 'Decent Work and Economic Growth'),
  (9, 'Industry, Innovation and Infrastructure'),
  (10, 'Reduced Inequalities'),
  (11, 'Sustainable Cities and Communities'),
  (12, 'Responsible Consumption and Production'),
  (13, 'Climate Action'),
  (14, 'Life Below Water'),
  (15, 'Life on Land'),
  (16, 'Peace, Justice and Strong Institutions'),
  (17, 'Partnerships for the Goals')
on conflict do nothing;

create table if not exists public.ifrc_challenges (
  id serial primary key,
  code text unique,
  name text not null
);
insert into public.ifrc_challenges (code, name) values
  ('climate_crises', 'Climate and Crises'),
  ('health', 'Health'),
  ('migration_identity', 'Migration and Identity'),
  ('values_power_inclusion', 'Values, Power and Inclusion'),
  ('trust_digital', 'Trust and Digital')
on conflict (code) do nothing;

create table if not exists public.project_sdgs (
  project_id uuid references public.projects(id) on delete cascade,
  sdg_id int references public.sdgs(id) on delete cascade,
  primary key (project_id, sdg_id)
);

create table if not exists public.project_ifrc_challenges (
  project_id uuid references public.projects(id) on delete cascade,
  challenge_id int references public.ifrc_challenges(id) on delete cascade,
  primary key (project_id, challenge_id)
);

create table if not exists public.project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  path text not null,
  mime_type text,
  caption text,
  created_by uuid default auth.uid(),
  created_at timestamptz default now()
);

create table if not exists public.project_posts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  title text,
  content text,
  created_by uuid default auth.uid(),
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.project_links enable row level security;
alter table public.project_partners enable row level security;
alter table public.sdgs enable row level security;
alter table public.ifrc_challenges enable row level security;
alter table public.project_sdgs enable row level security;
alter table public.project_ifrc_challenges enable row level security;
alter table public.project_media enable row level security;
alter table public.project_posts enable row level security;
alter table public.projects enable row level security;

-- Admin helper
create or replace function public.can_admin_projects()
returns boolean
language plpgsql
stable
as $fn$
declare
  has_no_arg boolean := to_regproc('public.is_admin()') is not null;
  has_uid_arg boolean := to_regproc('public.is_admin(uuid)') is not null;
begin
  if has_no_arg then
    return public.is_admin();
  elsif has_uid_arg then
    return public.is_admin(auth.uid());
  else
    return false;
  end if;
end;
$fn$;

-- Lookup policies
drop policy if exists "sdgs_public_select" on public.sdgs;
create policy "sdgs_public_select" on public.sdgs
  for select using (true);

drop policy if exists "ifrc_challenges_public_select" on public.ifrc_challenges;
create policy "ifrc_challenges_public_select" on public.ifrc_challenges
  for select using (true);

-- Recreate dependent view(s)
create view public.rejected_projects as
select *
from public.projects
where status = 'rejected';

-- Recreate projects policies
create policy "projects_select" on public.projects
  for select using (
    status = 'approved'
    or auth.uid() = created_by
    or public.can_admin_projects()
  );

create policy "projects_insert" on public.projects
  for insert to authenticated with check (auth.uid() = created_by and status = 'pending');

create policy "projects_update_owner" on public.projects
  for update using (auth.uid() = created_by and status = 'pending')
  with check (auth.uid() = created_by);

create policy "projects_update_admin" on public.projects
  for update using (public.can_admin_projects())
  with check (true);

create policy "projects_delete_owner" on public.projects
  for delete using (auth.uid() = created_by and status = 'pending');

create policy "projects_delete_admin" on public.projects
  for delete using (public.can_admin_projects());

-- Child table policies (drop old if exist, then create)
drop policy if exists "project_links_select"        on public.project_links;
drop policy if exists "project_links_owner_mod"     on public.project_links;
drop policy if exists "project_links_owner_update"  on public.project_links;
drop policy if exists "project_links_owner_delete"  on public.project_links;
drop policy if exists "project_links_admin_all"     on public.project_links;

create policy "project_links_select" on public.project_links
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_links.project_id
        and (p.status = 'approved' or auth.uid() = p.created_by or public.can_admin_projects())
    )
  );

create policy "project_links_owner_mod" on public.project_links
  for insert to authenticated with check (
    exists (
      select 1 from public.projects p
      where p.id = project_links.project_id and p.created_by = auth.uid() and p.status = 'pending'
    )
  );

create policy "project_links_owner_update" on public.project_links
  for update using (
    exists (
      select 1 from public.projects p
      where p.id = project_links.project_id and p.created_by = auth.uid() and p.status = 'pending'
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_links.project_id and p.created_by = auth.uid() and p.status = 'pending'
    )
  );

create policy "project_links_owner_delete" on public.project_links
  for delete using (
    exists (
      select 1 from public.projects p
      where p.id = project_links.project_id and p.created_by = auth.uid() and p.status = 'pending'
    )
  );

create policy "project_links_admin_all" on public.project_links
  for all using (public.can_admin_projects())
  with check (true);

drop policy if exists "project_partners_select"       on public.project_partners;
drop policy if exists "project_partners_owner_mod"    on public.project_partners;
drop policy if exists "project_partners_owner_update" on public.project_partners;
drop policy if exists "project_partners_owner_delete" on public.project_partners;
drop policy if exists "project_partners_admin_all"    on public.project_partners;

create policy "project_partners_select" on public.project_partners
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_partners.project_id
        and (p.status = 'approved' or auth.uid() = p.created_by or public.can_admin_projects())
    )
  );

create policy "project_partners_owner_mod" on public.project_partners
  for insert to authenticated with check (
    exists (
      select 1 from public.projects p
      where p.id = project_partners.project_id and p.created_by = auth.uid() and p.status = 'pending'
    )
  );

create policy "project_partners_owner_update" on public.project_partners
  for update using (
    exists (
      select 1 from public.projects p
      where p.id = project_partners.project_id and p.created_by = auth.uid() and p.status = 'pending'
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_partners.project_id and p.created_by = auth.uid() and p.status = 'pending'
    )
  );

create policy "project_partners_owner_delete" on public.project_partners
  for delete using (
    exists (
      select 1 from public.projects p
      where p.id = project_partners.project_id and p.created_by = auth.uid() and p.status = 'pending'
    )
  );

create policy "project_partners_admin_all" on public.project_partners
  for all using (public.can_admin_projects())
  with check (true);

drop policy if exists "project_sdgs_select"        on public.project_sdgs;
drop policy if exists "project_sdgs_owner_mod"     on public.project_sdgs;
drop policy if exists "project_sdgs_owner_delete"  on public.project_sdgs;
drop policy if exists "project_sdgs_admin_all"     on public.project_sdgs;

create policy "project_sdgs_select" on public.project_sdgs
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_sdgs.project_id
        and (p.status = 'approved' or auth.uid() = p.created_by or public.can_admin_projects())
    )
  );

create policy "project_sdgs_owner_mod" on public.project_sdgs
  for insert to authenticated with check (
    exists (
      select 1 from public.projects p
      where p.id = project_sdgs.project_id and p.created_by = auth.uid() and p.status = 'pending'
    )
  );

create policy "project_sdgs_owner_delete" on public.project_sdgs
  for delete using (
    exists (
      select 1 from public.projects p
      where p.id = project_sdgs.project_id and p.created_by = auth.uid() and p.status = 'pending'
    )
  );

create policy "project_sdgs_admin_all" on public.project_sdgs
  for all using (public.can_admin_projects())
  with check (true);

drop policy if exists "project_ifrc_select"       on public.project_ifrc_challenges;
drop policy if exists "project_ifrc_owner_mod"    on public.project_ifrc_challenges;
drop policy if exists "project_ifrc_owner_delete" on public.project_ifrc_challenges;
drop policy if exists "project_ifrc_admin_all"    on public.project_ifrc_challenges;

create policy "project_ifrc_select" on public.project_ifrc_challenges
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_ifrc_challenges.project_id
        and (p.status = 'approved' or auth.uid() = p.created_by or public.can_admin_projects())
    )
  );

create policy "project_ifrc_owner_mod" on public.project_ifrc_challenges
  for insert to authenticated with check (
    exists (
      select 1 from public.projects p
      where p.id = project_ifrc_challenges.project_id and p.created_by = auth.uid() and p.status = 'pending'
    )
  );

create policy "project_ifrc_owner_delete" on public.project_ifrc_challenges
  for delete using (
    exists (
      select 1 from public.projects p
      where p.id = project_ifrc_challenges.project_id and p.created_by = auth.uid() and p.status = 'pending'
    )
  );

create policy "project_ifrc_admin_all" on public.project_ifrc_challenges
  for all using (public.can_admin_projects())
  with check (true);

drop policy if exists "project_media_select"       on public.project_media;
drop policy if exists "project_media_owner_mod"    on public.project_media;
drop policy if exists "project_media_owner_update" on public.project_media;
drop policy if exists "project_media_owner_delete" on public.project_media;
drop policy if exists "project_media_admin_all"    on public.project_media;

create policy "project_media_select" on public.project_media
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_media.project_id
        and (p.status = 'approved' or auth.uid() = p.created_by or public.can_admin_projects())
    )
  );

create policy "project_media_owner_mod" on public.project_media
  for insert to authenticated with check (
    exists (
      select 1 from public.projects p
      where p.id = project_media.project_id and p.created_by = auth.uid() and p.status = 'pending'
    )
  );

create policy "project_media_owner_update" on public.project_media
  for update using (
    exists (
      select 1 from public.projects p
      where p.id = project_media.project_id and p.created_by = auth.uid() and p.status = 'pending'
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_media.project_id and p.created_by = auth.uid() and p.status = 'pending'
    )
  );

create policy "project_media_owner_delete" on public.project_media
  for delete using (
    exists (
      select 1 from public.projects p
      where p.id = project_media.project_id and p.created_by = auth.uid() and p.status = 'pending'
    )
  );

create policy "project_media_admin_all" on public.project_media
  for all using (public.can_admin_projects())
  with check (true);

drop policy if exists "project_posts_select"       on public.project_posts;
drop policy if exists "project_posts_owner_mod"    on public.project_posts;
drop policy if exists "project_posts_owner_update" on public.project_posts;
drop policy if exists "project_posts_owner_delete" on public.project_posts;
drop policy if exists "project_posts_admin_all"    on public.project_posts;

create policy "project_posts_select" on public.project_posts
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_posts.project_id
        and (p.status = 'approved' or auth.uid() = p.created_by or public.can_admin_projects())
    )
  );

create policy "project_posts_owner_mod" on public.project_posts
  for insert to authenticated with check (
    exists (
      select 1 from public.projects p
      where p.id = project_posts.project_id and p.created_by = auth.uid() and p.status = 'pending'
    )
  );

create policy "project_posts_owner_update" on public.project_posts
  for update using (
    exists (
      select 1 from public.projects p
      where p.id = project_posts.project_id and p.created_by = auth.uid() and p.status = 'pending'
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_posts.project_id and p.created_by = auth.uid() and p.status = 'pending'
    )
  );

create policy "project_posts_owner_delete" on public.project_posts
  for delete using (
    exists (
      select 1 from public.projects p
      where p.id = project_posts.project_id and p.created_by = auth.uid() and p.status = 'pending'
    )
  );

create policy "project_posts_admin_all" on public.project_posts
  for all using (public.can_admin_projects())
  with check (true);

-- API helper
create or replace function public.create_project_submission(
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

grant execute on function public.create_project_submission(
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

commit;
