-- Roles foundation

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('superadmin', 'admin', 'user', 'org')),
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('admin', 'superadmin')
  );
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'superadmin'
  );
$$;

create policy "user_roles_select_own"
  on public.user_roles
  for select
  using (auth.uid() = user_id);

create policy "user_roles_insert_superadmin"
  on public.user_roles
  for insert
  with check (public.is_superadmin());

create policy "user_roles_update_superadmin"
  on public.user_roles
  for update
  using (public.is_superadmin())
  with check (public.is_superadmin());

create policy "user_roles_delete_superadmin"
  on public.user_roles
  for delete
  using (public.is_superadmin());

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_superadmin() to authenticated;
