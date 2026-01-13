-- Grants directory table + policies

create table if not exists public.grants (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  is_published boolean not null default false,
  status text not null default 'open',
  title text not null,
  slug text not null unique,
  summary text,
  description text,
  funder_name text,
  funder_website text,
  application_url text not null,
  contact_email text,
  funding_type text not null,
  project_type text not null,
  currency text not null default 'EUR',
  amount_min numeric,
  amount_max numeric,
  open_date date,
  deadline date,
  decision_date date,
  start_date date,
  eligible_countries text[],
  eligible_regions text[],
  remote_ok boolean not null default true,
  location_name text,
  latitude double precision,
  longitude double precision,
  themes text[],
  sdgs int[],
  keywords text[],
  notes_internal text,
  source text,
  constraint grants_status_check check (status in ('open', 'closed', 'rolling')),
  constraint grants_funding_type_check check (
    funding_type in ('grant', 'prize', 'fellowship', 'loan', 'equity', 'in-kind', 'other')
  ),
  constraint grants_project_type_check check (
    project_type in ('environmental', 'humanitarian', 'both')
  )
);

create index if not exists grants_status_idx on public.grants (status);
create index if not exists grants_project_type_idx on public.grants (project_type);
create index if not exists grants_deadline_idx on public.grants (deadline);
create index if not exists grants_lat_lng_idx on public.grants (latitude, longitude);
create index if not exists grants_themes_gin on public.grants using gin (themes);
create index if not exists grants_eligible_countries_gin on public.grants using gin (eligible_countries);
create index if not exists grants_sdgs_gin on public.grants using gin (sdgs);
create index if not exists grants_keywords_gin on public.grants using gin (keywords);

-- updated_at trigger

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'grants_set_updated_at'
  ) then
    create trigger grants_set_updated_at
    before update on public.grants
    for each row
    execute function public.set_updated_at();
  end if;
end $$;

-- RLS
alter table public.grants enable row level security;

create policy "Public can read published open grants"
on public.grants
for select
using (
  is_published = true
  and status in ('open', 'rolling')
);

create policy "Users can insert own grants"
on public.grants
for insert
to authenticated
with check (created_by = auth.uid());

create policy "Users can update own grants"
on public.grants
for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

create policy "Users can delete own grants"
on public.grants
for delete
to authenticated
using (created_by = auth.uid());

create policy "Admins can manage grants"
on public.grants
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
