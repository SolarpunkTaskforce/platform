-- Ensure superadmin is treated as admin for UI + route guards that call is_admin()

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path to ''
as $function$
  select
    public.is_superadmin()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    );
$function$;

-- If you use the uid-arg version anywhere with auth.uid(), make it consistent too:
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
set search_path to ''
as $function$
  select
    (uid = auth.uid() and public.is_superadmin())
    or coalesce(
      (select p.is_admin from public.profiles p where p.id = uid),
      false
    );
$function$;
