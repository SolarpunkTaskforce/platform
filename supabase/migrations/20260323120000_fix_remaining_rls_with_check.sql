-- Fix remaining permissive RLS policies flagged by Supabase Advisor:
-- - organisations.orgs_authenticated_insert (INSERT) has WITH CHECK (true)
-- - projects.projects_admin_update (UPDATE) has WITH CHECK (true)
-- - watchdog_cases.wd_admin_update (UPDATE) has WITH CHECK (true)

-- 1) projects: ensure WITH CHECK is admin-only (matches intended admin qualifier)
drop policy if exists projects_admin_update on public.projects;
create policy projects_admin_update
on public.projects
for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- 2) watchdog_cases: ensure WITH CHECK is admin-only (matches intended admin qualifier)
drop policy if exists wd_admin_update on public.watchdog_cases;
create policy wd_admin_update
on public.watchdog_cases
for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- 3) organisations: replace permissive INSERT policy with an ownership-bound check
-- We do NOT guess the column name; we detect a suitable column.
do $$
declare
  owner_col text;
begin
  select c.column_name
    into owner_col
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'organisations'
    and c.column_name in (
      'created_by',
      'creator_id',
      'owner_id',
      'primary_owner_id',
      'created_by_user_id',
      'user_id'
    )
  order by
    case c.column_name
      when 'created_by' then 1
      when 'creator_id' then 2
      when 'owner_id' then 3
      when 'primary_owner_id' then 4
      when 'created_by_user_id' then 5
      when 'user_id' then 6
      else 100
    end
  limit 1;

  if owner_col is null then
    raise exception
      'Cannot harden organisations INSERT policy: no ownership column found on public.organisations. Add/identify an ownership column (e.g., created_by UUID) and rerun.';
  end if;

  execute 'drop policy if exists orgs_authenticated_insert on public.organisations';

  execute format($fmt$
    create policy orgs_authenticated_insert
    on public.organisations
    for insert
    to authenticated
    with check (%I = auth.uid())
  $fmt$, owner_col);
end $$;
