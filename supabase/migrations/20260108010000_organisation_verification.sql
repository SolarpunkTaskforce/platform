begin;

alter table public.organisations
  add column if not exists verification_status text,
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid references auth.users(id),
  add column if not exists created_by uuid references auth.users(id);

update public.organisations
set verification_status = 'pending'
where verification_status is null;

alter table public.organisations
  alter column verification_status set default 'pending',
  alter column verification_status set not null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'organisations_verification_status_check'
  ) then
    alter table public.organisations
      drop constraint organisations_verification_status_check;
  end if;
end $$;

alter table public.organisations
  add constraint organisations_verification_status_check
  check (verification_status in ('pending', 'verified', 'rejected'));

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organisations'
      and column_name = 'owner_id'
  ) then
    execute 'update public.organisations set created_by = owner_id where created_by is null and owner_id is not null';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organisations'
      and column_name = 'creator_id'
  ) then
    execute 'update public.organisations set created_by = creator_id where created_by is null and creator_id is not null';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from public.organisations
    where created_by is null
  ) then
    alter table public.organisations
      alter column created_by set not null;
  end if;
end $$;

alter table public.organisations enable row level security;

drop policy if exists "organisations_select_verified" on public.organisations;
drop policy if exists "organisations_select_creator" on public.organisations;
drop policy if exists "organisations_select_admin" on public.organisations;
drop policy if exists "organisations_insert_creator" on public.organisations;
drop policy if exists "organisations_update_creator_pending" on public.organisations;
drop policy if exists "organisations_update_admin" on public.organisations;
drop policy if exists "organisations_delete_admin" on public.organisations;

create policy "organisations_select_verified"
  on public.organisations
  for select
  to anon, authenticated
  using (verification_status = 'verified');

create policy "organisations_select_creator"
  on public.organisations
  for select
  to authenticated
  using (created_by = auth.uid());

create policy "organisations_select_admin"
  on public.organisations
  for select
  to authenticated
  using (public.is_admin());

create policy "organisations_insert_creator"
  on public.organisations
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and verification_status = 'pending'
  );

create policy "organisations_update_creator_pending"
  on public.organisations
  for update
  to authenticated
  using (
    created_by = auth.uid()
    and verification_status = 'pending'
  )
  with check (
    created_by = auth.uid()
    and verification_status = 'pending'
    and verified_at is null
    and verified_by is null
  );

create policy "organisations_update_admin"
  on public.organisations
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "organisations_delete_admin"
  on public.organisations
  for delete
  to authenticated
  using (public.is_admin());

create or replace view public.verified_organisations as
select id, name, slug
from public.organisations
where verification_status = 'verified';

grant select on public.verified_organisations to anon, authenticated;

commit;
