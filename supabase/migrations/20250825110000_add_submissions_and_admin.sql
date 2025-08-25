-- add is_admin to profiles
alter table public.profiles add column if not exists is_admin boolean default false;

-- projects table (MVP fields; extend later)
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  links jsonb,
  lead_org_id uuid references public.organisations(id) on delete set null,
  partner_org_ids uuid[],
  country text,
  region text,
  lat double precision,
  lng double precision,
  intervention_type text,
  target_demographics text[],
  lives_improved integer,
  start_date date,
  end_date date,
  thematic_area text,
  sdgs text[],
  ifrc_global_challenges text[],
  donations_received numeric default 0,
  funding_needed numeric,
  status text not null default 'planned' check (status in ('planned','active','completed')),
  review_status text not null default 'pending' check (review_status in ('pending','approved','rejected')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);
alter table public.projects enable row level security;

-- watchdog cases table (MVP fields; extend later)
create table if not exists public.watchdog_cases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  country text,
  region text,
  lat double precision,
  lng double precision,
  target_demographics text[],
  links jsonb,
  sdgs text[],
  ifrc_global_challenges text[],
  review_status text not null default 'pending' check (review_status in ('pending','approved','rejected')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);
alter table public.watchdog_cases enable row level security;

-- helper: check admin flag on profile
create or replace function public.is_admin(uid uuid)
returns boolean language sql stable as $$
  select coalesce((select is_admin from public.profiles p where p.id = uid), false)
$$;

-- RLS for projects
drop policy if exists "projects_public_read_approved_or_owner" on public.projects;
create policy "projects_public_read_approved_or_owner" on public.projects
for select using ( review_status = 'approved' or auth.uid() = created_by );

drop policy if exists "projects_insert_auth" on public.projects;
create policy "projects_insert_auth" on public.projects
for insert to authenticated with check ( auth.uid() = created_by );

drop policy if exists "projects_update_owner_while_pending" on public.projects;
create policy "projects_update_owner_while_pending" on public.projects
for update using ( auth.uid() = created_by and review_status = 'pending' )
with check ( auth.uid() = created_by );

drop policy if exists "projects_admin_update" on public.projects;
create policy "projects_admin_update" on public.projects
for update using ( public.is_admin(auth.uid()) ) with check ( true );

-- RLS for watchdog_cases
drop policy if exists "wd_public_read_approved_or_owner" on public.watchdog_cases;
create policy "wd_public_read_approved_or_owner" on public.watchdog_cases
for select using ( review_status = 'approved' or auth.uid() = created_by );

drop policy if exists "wd_insert_auth" on public.watchdog_cases;
create policy "wd_insert_auth" on public.watchdog_cases
for insert to authenticated with check ( auth.uid() = created_by );

drop policy if exists "wd_update_owner_while_pending" on public.watchdog_cases;
create policy "wd_update_owner_while_pending" on public.watchdog_cases
for update using ( auth.uid() = created_by and review_status = 'pending' )
with check ( auth.uid() = created_by );

drop policy if exists "wd_admin_update" on public.watchdog_cases;
create policy "wd_admin_update" on public.watchdog_cases
for update using ( public.is_admin(auth.uid()) ) with check ( true );
