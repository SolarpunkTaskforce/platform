-- Lock down search_path on security-relevant functions.
-- Adjust the function name/signature if different in your project.

-- Ensure the function exists before altering; safe for re-runs.
do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'is_admin'
  ) then
    -- Limit to trusted schemas only. Exclude pg_temp and pg_catalog overrides.
    alter function public.is_admin()
      set search_path = public, auth;
  end if;
end$$;

-- Example: if you have any SECURITY DEFINER functions, set their search_path explicitly.
-- Replace <schema>.<fn>(<sig>) as needed and duplicate the ALTER line per function.
-- alter function <schema>.<fn>(<signature>) set search_path = <schema>, auth;
