-- Watchdog issues table + policies

create table if not exists public.watchdog_issues (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),

  status text not null default 'pending',
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  rejected_at timestamptz,
  rejected_by uuid references auth.users(id),
  rejection_reason text,

  title text not null,
  description text not null,

  country text,
  region text,
  city text,
  latitude double precision not null,
  longitude double precision not null,

  sdgs int[] not null default '{}'::int[],
  global_challenges text[] not null default '{}'::text[],
  affected_demographics text[] not null default '{}'::text[],
  affected_groups_text text,

  urgency int not null default 3,
  date_observed date,

  evidence_links text[] not null default '{}'::text[],
  desired_outcome text,
  contact_allowed boolean not null default true,
  reporter_anonymous boolean not null default false,

  constraint watchdog_issues_status_check check (status in ('pending', 'approved', 'rejected')),
  constraint watchdog_issues_urgency_check check (urgency between 1 and 5)
);

create index if not exists watchdog_issues_status_created_at_idx
  on public.watchdog_issues (status, created_at);
create index if not exists watchdog_issues_lat_lng_idx
  on public.watchdog_issues (latitude, longitude);
create index if not exists watchdog_issues_sdgs_gin
  on public.watchdog_issues using gin (sdgs);
create index if not exists watchdog_issues_global_challenges_gin
  on public.watchdog_issues using gin (global_challenges);
create index if not exists watchdog_issues_affected_demographics_gin
  on public.watchdog_issues using gin (affected_demographics);

-- updated_at trigger

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'watchdog_issues_set_updated_at'
  ) then
    create trigger watchdog_issues_set_updated_at
    before update on public.watchdog_issues
    for each row
    execute function public.set_updated_at();
  end if;
end $$;

-- RLS
alter table public.watchdog_issues enable row level security;

create policy "Public can read approved watchdog issues"
  on public.watchdog_issues
  for select
  using (status = 'approved');

create policy "Users can read own watchdog issues"
  on public.watchdog_issues
  for select
  to authenticated
  using (created_by = auth.uid());

create policy "Users can insert watchdog issues"
  on public.watchdog_issues
  for insert
  to authenticated
  with check (created_by = auth.uid() and status = 'pending');

create policy "Users can update pending watchdog issues"
  on public.watchdog_issues
  for update
  to authenticated
  using (created_by = auth.uid() and status = 'pending')
  with check (created_by = auth.uid() and status = 'pending');

create policy "Admins can manage watchdog issues"
  on public.watchdog_issues
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
