-- Allow authenticated users to create organisations, but only as themselves.

alter table public.organisations enable row level security;

drop policy if exists "organisations_insert_own" on public.organisations;

create policy "organisations_insert_own"
on public.organisations
for insert
to authenticated
with check (created_by = auth.uid());
