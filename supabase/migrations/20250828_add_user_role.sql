-- Create enum if missing
do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'user_role' and n.nspname = 'public') then
    create type public.user_role as enum ('admin','member');
  end if;
end$$;

-- Add role column if missing
alter table public.profiles
  add column if not exists role public.user_role not null default 'member';

-- Helper: is_admin(uid)
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1 from public.profiles p where p.id = uid and p.role = 'admin'
  );
$$;

-- Index helpful for role lookups
create index if not exists profiles_role_idx on public.profiles(role);
