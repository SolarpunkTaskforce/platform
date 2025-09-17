-- Add profiles.role if missing
do 354
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = public and table_name = profiles and column_name = role
  ) then
    alter table public.profiles add column role text;
  end if;
end 354;

-- Create is_admin(uid) if missing
do 354
begin
  if not exists (
    select 1
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = public and p.proname = is_admin
  ) then
    create function public.is_admin(uid uuid default auth.uid())
    returns boolean
    language sql stable
    as 1994
      select exists (
        select 1 from public.profiles pr
        where pr.id = uid and pr.role in (admin,superadmin)
      );
    1994;
  end if;
end 354;
