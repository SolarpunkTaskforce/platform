begin;

-- Ensure REST roles can select base tables (RLS still governs row visibility)
grant select on public.profiles to anon, authenticated;
grant select on public.organisations to anon, authenticated;
grant select on public.organisation_members to authenticated;

-- Let organisation members read their org records (even before verification)
drop policy if exists "Org members can read their organisations" on public.organisations;
create policy "Org members can read their organisations"
on public.organisations
for select
to authenticated
using (
  exists (
    select 1
    from public.organisation_members om
    where om.organisation_id = organisations.id
      and om.user_id = auth.uid()
  )
);

commit;
