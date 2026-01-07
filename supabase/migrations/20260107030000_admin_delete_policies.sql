-- Admin delete policies (idempotent + safe across environments)
-- Assumes you already have a SQL function: is_admin() returns boolean

-- Projects: allow admin delete
alter table public.projects enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'projects'
      and policyname = 'Admins can delete projects'
  ) then
    create policy "Admins can delete projects"
    on public.projects
    for delete
    using (is_admin());
  end if;
end $$;

-- Child tables: allow admin delete (idempotent)
alter table public.project_links enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='project_links' and policyname='Admins can delete project_links'
  ) then
    create policy "Admins can delete project_links"
    on public.project_links
    for delete
    using (is_admin());
  end if;
end $$;

alter table public.project_media enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='project_media' and policyname='Admins can delete project_media'
  ) then
    create policy "Admins can delete project_media"
    on public.project_media
    for delete
    using (is_admin());
  end if;
end $$;

alter table public.project_partners enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='project_partners' and policyname='Admins can delete project_partners'
  ) then
    create policy "Admins can delete project_partners"
    on public.project_partners
    for delete
    using (is_admin());
  end if;
end $$;

alter table public.project_sdgs enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='project_sdgs' and policyname='Admins can delete project_sdgs'
  ) then
    create policy "Admins can delete project_sdgs"
    on public.project_sdgs
    for delete
    using (is_admin());
  end if;
end $$;

alter table public.project_ifrc_challenges enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='project_ifrc_challenges' and policyname='Admins can delete project_ifrc_challenges'
  ) then
    create policy "Admins can delete project_ifrc_challenges"
    on public.project_ifrc_challenges
    for delete
    using (is_admin());
  end if;
end $$;

-- project_shares: only if the table exists (safe if not deployed everywhere)
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'project_shares'
  ) then
    alter table public.project_shares enable row level security;

    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'project_shares'
        and policyname = 'Admins can delete project_shares'
    ) then
      create policy "Admins can delete project_shares"
      on public.project_shares
      for delete
      using (is_admin());
    end if;
  end if;
end $$;
