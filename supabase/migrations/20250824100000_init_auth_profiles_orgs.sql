-- Auth + accounts

-- 1) Organisations
create table if not exists public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  website text,
  country text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);
alter table public.organisations enable row level security;

-- 2) Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  kind text not null default 'individual' check (kind in ('individual','organisation')),
  full_name text,
  surname text,
  nationality text,
  organisation_name text,
  organisation_id uuid references public.organisations(id) on delete set null,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;

-- 3) Organisation members
create table if not exists public.organisation_members (
  organisation_id uuid references public.organisations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','member')),
  created_at timestamptz default now(),
  primary key (organisation_id, user_id)
);
alter table public.organisation_members enable row level security;

-- Trigger to create a blank profile for each new auth.user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- RLS Policies

-- Profiles: public readable; user updates self
drop policy if exists "profiles_public_read" on public.profiles;
create policy "profiles_public_read" on public.profiles
for select using (true);

drop policy if exists "profiles_user_update_self" on public.profiles;
create policy "profiles_user_update_self" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

-- Organisations: public read; insert any authed; updates by admins
drop policy if exists "orgs_public_read" on public.organisations;
create policy "orgs_public_read" on public.organisations
for select using (true);

drop policy if exists "orgs_authenticated_insert" on public.organisations;
create policy "orgs_authenticated_insert" on public.organisations
for insert to authenticated with check (true);

drop policy if exists "orgs_members_update" on public.organisations;
create policy "orgs_members_update" on public.organisations
for update using (
  exists (
    select 1 from public.organisation_members m
    where m.organisation_id = organisations.id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin')
  )
);

-- Organisation members: members read; admins manage
drop policy if exists "org_members_read" on public.organisation_members;
create policy "org_members_read" on public.organisation_members
for select using (
  exists (
    select 1 from public.organisation_members m2
    where m2.organisation_id = organisation_members.organisation_id
      and m2.user_id = auth.uid()
  )
);

drop policy if exists "org_members_insert_self_owner" on public.organisation_members;
create policy "org_members_insert_self_owner" on public.organisation_members
for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "org_members_update_admins" on public.organisation_members;
create policy "org_members_update_admins" on public.organisation_members
for update using (
  exists (
    select 1 from public.organisation_members m3
    where m3.organisation_id = organisation_members.organisation_id
      and m3.user_id = auth.uid()
      and m3.role in ('owner','admin')
  )
) with check (
  exists (
    select 1 from public.organisation_members m4
    where m4.organisation_id = organisation_members.organisation_id
      and m4.user_id = auth.uid()
      and m4.role in ('owner','admin')
  )
);
