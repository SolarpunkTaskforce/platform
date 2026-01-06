-- 0014_extension_in_public: move citext out of public
create schema if not exists extensions;

do $$
begin
  -- Only move if it's still in public
  if exists (
    select 1
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
    where e.extname = 'citext'
      and n.nspname = 'public'
  ) then
    alter extension citext set schema extensions;
  end if;
end $$;

-- 0011_function_search_path_mutable: freeze search_path for functions
-- Supabase recommends: SET search_path = '' and schema-qualify all references.

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path to ''
as $function$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$function$;

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
set search_path to ''
as $function$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = uid),
    false
  );
$function$;

create or replace function public.can_admin_projects()
returns boolean
language plpgsql
stable
set search_path to ''
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

create or replace function public.is_superadmin_email(e text)
returns boolean
language sql
stable
set search_path to ''
as $function$
  select coalesce(
    (e)::extensions.citext = (
      select superadmin_email
      from public.app_settings
      where id is true
    ),
    false
  );
$function$;

create or replace function public.is_admin_email(e text)
returns boolean
language sql
stable
set search_path to ''
as $function$
  select public.is_superadmin_email(e)
  or exists (
    select 1
    from public.admin_emails a
    where a.email = (e)::extensions.citext
  )
  or exists (
    select 1
    from public.profiles p
    join auth.users u on u.id = p.id
    where (u.email)::extensions.citext = (e)::extensions.citext
      and p.role = 'admin'
  );
$function$;
