-- Admin delete policies for project child tables
-- (projects already has projects_delete_admin / projects_delete_owner)

-- Assumes function is_admin() exists.

-- project_links
alter table public.project_links enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public'
      and tablename='project_links'
      and cmd='DELETE'
      and policyname='project_links_delete_admin'
  ) then
    create policy "project_links_delete_admin"
      on public.project_links
      for delete
      using (is_admin());
  end if;
end $$;

-- project_media
alter table public.project_media enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public'
      and tablename='project_media'
      and cmd='DELETE'
      and policyname='project_media_delete_admin'
  ) then
    create policy "project_media_delete_admin"
      on public.project_media
      for delete
      using (is_admin());
  end if;
end $$;

-- project_partners
alter table public.project_partners enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public'
      and tablename='project_partners'
      and cmd='DELETE'
      and policyname='project_partners_delete_admin'
  ) then
    create policy "project_partners_delete_admin"
      on public.project_partners
      for delete
      using (is_admin());
  end if;
end $$;

-- project_sdgs
alter table public.project_sdgs enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public'
      and tablename='project_sdgs'
      and cmd='DELETE'
      and policyname='project_sdgs_delete_admin'
  ) then
    create policy "project_sdgs_delete_admin"
      on public.project_sdgs
      for delete
      using (is_admin());
  end if;
end $$;

-- project_ifrc_challenges
alter table public.project_ifrc_challenges enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public'
      and tablename='project_ifrc_challenges'
      and cmd='DELETE'
      and policyname='project_ifrc_challenges_delete_admin'
  ) then
    create policy "project_ifrc_challenges_delete_admin"
      on public.project_ifrc_challenges
      for delete
      using (is_admin());
  end if;
end $$;

-- project_shares (only if table exists; some envs don’t have it)
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema='public'
      and table_name='project_shares'
  ) then
    alter table public.project_shares enable row level security;

    if not exists (
      select 1 from pg_policies
      where schemaname='public'
        and tablename='project_shares'
        and cmd='DELETE'
        and policyname='project_shares_delete_admin'
    ) then
      create policy "project_shares_delete_admin"
        on public.project_shares
        for delete
        using (is_admin());
    end if;
  end if;
end $$;
