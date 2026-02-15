-- Ensure organisation_members has proper RLS policies for onboarding
-- Users can insert themselves as members when creating an organisation

alter table public.organisation_members enable row level security;

-- Drop existing insert policy if present (idempotent)
drop policy if exists "org_members_insert_self_owner" on public.organisation_members;

-- Allow authenticated users to insert themselves as members
create policy "org_members_insert_self_owner"
on public.organisation_members
for insert
to authenticated
with check (user_id = auth.uid());
