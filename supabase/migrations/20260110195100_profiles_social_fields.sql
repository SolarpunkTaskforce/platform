-- Phase 1 / Migration 3: profiles social fields + verified org linking via RLS

-- 1) Ensure profiles table exists (if your repo already has it, this does nothing)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Add required/optional profile fields (idempotent)
alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists date_of_birth date,
  add column if not exists country_from text,
  add column if not exists country_based text,
  add column if not exists occupation text,
  add column if not exists bio text,
  add column if not exists social_links jsonb,
  add column if not exists avatar_url text,
  add column if not exists organisation_id uuid null references public.organisations(id);

-- 3) updated_at trigger (safe)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'profiles_set_updated_at'
  ) then
    create trigger profiles_set_updated_at
    before update on public.profiles
    for each row
    execute function public.set_updated_at();
  end if;
end $$;

-- 4) Enable RLS
alter table public.profiles enable row level security;

-- Drop existing policies if they exist (idempotent)
do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Public can read profiles') then
    execute 'drop policy "Public can read profiles" on public.profiles';
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Users can insert own profile') then
    execute 'drop policy "Users can insert own profile" on public.profiles';
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Users can update own profile') then
    execute 'drop policy "Users can update own profile" on public.profiles';
  end if;
end $$;

-- 5) Public read (social profiles). If you want "auth-only", change anon to authenticated later.
create policy "Public can read profiles"
on public.profiles
for select
using (true);

-- 6) Insert: user can create their own profile, and org must be verified if set
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (
  id = auth.uid()
  and (
    organisation_id is null
    or exists (
      select 1
      from public.organisations o
      where o.id = organisation_id
        and o.verification_status = 'verified'
    )
  )
);

-- 7) Update: user can update their own profile, and org must stay verified if set
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and (
    organisation_id is null
    or exists (
      select 1
      from public.organisations o
      where o.id = organisation_id
        and o.verification_status = 'verified'
    )
  )
);
