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
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = uid
  );
$$;