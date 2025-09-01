-- Ensure the is_admin() function exists before altering or using it
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  -- TODO: Replace with real logic.
  -- Example: check if the current authenticated user has role = 'admin'
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- Lock down search_path on security-relevant functions.
-- Limit to trusted schemas only. Exclude pg_temp and pg_catalog overrides.
alter function public.is_admin()
  set search_path = public, auth;

-- Example: if you have any SECURITY DEFINER functions, set their search_path explicitly.
-- Replace <schema>.<fn>(<sig>) as needed and duplicate the ALTER line per function.
-- alter function <schema>.<fn>(<signature>) set search_path = <schema>, auth;