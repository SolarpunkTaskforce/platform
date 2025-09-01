-- supabase/migrations/20250827_fix_security_warnings.sql

-- 1) Ensure profiles.role exists
alter table public.profiles
  add column if not exists role text not null default 'user';

-- Optional: backfill real admins here
-- update public.profiles set role = 'admin' where <your condition>;

-- 2) Define is_admin() using profiles.role
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- 3) Lock down search_path for security-relevant functions
alter function public.is_admin()
  set search_path = public, auth;