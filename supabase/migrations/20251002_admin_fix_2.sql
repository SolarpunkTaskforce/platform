-- Fix helpers: no email on profiles; use auth.users
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
  or exists (
    select 1
    from public.profiles p
    join auth.users u on u.id = p.id
    where u.email::citext = (e)::citext and p.role = 'admin'
  );
$$;

-- Keep runtime RPCs consistent
create or replace function public.is_superadmin()
returns boolean language sql stable security definer set search_path='public' as $$
  select coalesce(
    (auth.jwt()->>'email')::citext =
    (select superadmin_email from public.app_settings where id is true),
    false
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable set search_path='public','auth' as $$
  select public.is_superadmin()
  or exists (select 1 from public.admin_emails a where a.email = (auth.jwt()->>'email')::citext)
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Back-compat wrapper for policies that call is_admin(auth.uid())
create or replace function public.is_admin(uid uuid)
returns boolean language sql stable as $$
  select public.is_admin();
$$;
