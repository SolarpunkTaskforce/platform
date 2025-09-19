-- Add profiles.role if missing
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'
  ) then
    alter table public.profiles add column role text;
  end if;
end $$;

-- Create is_admin(uid) if missing
do $$
begin
  if not exists (
    select 1
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_admin'
  ) then
    execute $f$
      create function public.is_admin(uid uuid default auth.uid())
      returns boolean
      stable
      language sql
      as $$
        select exists (
          select 1 from public.profiles pr
          where pr.id = uid and pr.role in ('admin','superadmin')
        );
      $$;
    $f$;
  end if;
end $$;
