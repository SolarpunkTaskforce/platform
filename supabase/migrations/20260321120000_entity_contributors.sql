cat > supabase/migrations/20260321120000_entity_contributors.sql <<'SQL'
-- Create entity_contributors table (universal attribution/contact persons)

create table if not exists public.entity_contributors (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('project', 'funding', 'issue')),
  entity_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  title_label text null,
  is_public boolean not null default true,
  added_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists entity_contributors_entity_idx
  on public.entity_contributors (entity_type, entity_id);

create index if not exists entity_contributors_user_id_idx
  on public.entity_contributors (user_id);

alter table public.entity_contributors enable row level security;

drop policy if exists entity_contributors_select_public on public.entity_contributors;
create policy entity_contributors_select_public
  on public.entity_contributors
  for select
  to anon, authenticated
  using (is_public = true);

drop policy if exists entity_contributors_select_own on public.entity_contributors;
create policy entity_contributors_select_own
  on public.entity_contributors
  for select
  to authenticated
  using (user_id = auth.uid() or added_by = auth.uid());

-- SAFE BASELINE INSERT: user can only add themselves
drop policy if exists entity_contributors_insert_self_only on public.entity_contributors;
create policy entity_contributors_insert_self_only
  on public.entity_contributors
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and (added_by is null or added_by = auth.uid())
  );

drop policy if exists entity_contributors_update_self on public.entity_contributors;
create policy entity_contributors_update_self
  on public.entity_contributors
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists entity_contributors_delete_self on public.entity_contributors;
create policy entity_contributors_delete_self
  on public.entity_contributors
  for delete
  to authenticated
  using (user_id = auth.uid());

grant select on public.entity_contributors to anon, authenticated;
grant insert, update, delete on public.entity_contributors to authenticated;
SQL
