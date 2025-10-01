-- Helpers for Studio testing (no JWT there)
create or replace function public.is_superadmin_email(e text)
returns boolean language sql stable as $$
  select coalesce(
    (e)::citext = (select superadmin_email from public.app_settings where id is true),
    false
  );
$$;

create or replace function public.is_admin_email(e text)
returns boolean language sql stable as $$
  select public.is_superadmin_email(e)
  or exists (select 1 from public.admin_emails a where a.email = (e)::citext)
  or exists (select 1 from public.profiles p where p.email = (e)::citext and p.role = 'admin');
$$;

-- Unify runtime admin checks
create or replace function public.is_superadmin()
returns boolean language sql stable security definer set search_path='public' as $$
  select coalesce(
    (auth.jwt()->>'email')::citext =
    (select superadmin_email from public.app_settings where id is true),
    false
  );
$$;

-- Replace both overloads of is_admin to one definition set
drop function if exists public.is_admin(uid uuid);

create or replace function public.is_admin()
returns boolean language sql stable set search_path='public','auth' as $$
  select public.is_superadmin()
  or exists (select 1 from public.admin_emails a where a.email = (auth.jwt()->>'email')::citext)
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;
