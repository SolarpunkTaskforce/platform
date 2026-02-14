-- Phase 5: Add org updates, watchdog issue updates, and funding to activity feed

-- A) Create organisation_updates table
create table if not exists public.organisation_updates (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete restrict,
  title text not null,
  body text not null,
  visibility text not null default 'org' check (visibility in ('public', 'org')),
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists organisation_updates_organisation_published_idx
  on public.organisation_updates (organisation_id, published_at desc);

create index if not exists organisation_updates_published_idx
  on public.organisation_updates (published_at desc);

alter table public.organisation_updates enable row level security;

-- RLS for organisation_updates
create policy organisation_updates_select_public
  on public.organisation_updates
  for select
  using (
    visibility = 'public'
    and exists (
      select 1
      from public.organisations o
      where o.id = organisation_id
        and o.verification_status = 'verified'
    )
  );

create policy organisation_updates_select_author
  on public.organisation_updates
  for select
  to authenticated
  using (author_user_id = auth.uid());

create policy organisation_updates_insert_author
  on public.organisation_updates
  for insert
  to authenticated
  with check (author_user_id = auth.uid());

create policy organisation_updates_update_author
  on public.organisation_updates
  for update
  to authenticated
  using (author_user_id = auth.uid())
  with check (author_user_id = auth.uid());

create policy organisation_updates_delete_author
  on public.organisation_updates
  for delete
  to authenticated
  using (author_user_id = auth.uid());

create policy organisation_updates_admin_all
  on public.organisation_updates
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- B) Create watchdog_issue_updates table
create table if not exists public.watchdog_issue_updates (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.watchdog_issues(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete restrict,
  title text not null,
  body text not null,
  visibility text not null default 'watchdog' check (visibility in ('public', 'watchdog')),
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists watchdog_issue_updates_issue_published_idx
  on public.watchdog_issue_updates (issue_id, published_at desc);

create index if not exists watchdog_issue_updates_published_idx
  on public.watchdog_issue_updates (published_at desc);

alter table public.watchdog_issue_updates enable row level security;

-- RLS for watchdog_issue_updates
create policy watchdog_issue_updates_select_public
  on public.watchdog_issue_updates
  for select
  using (
    visibility = 'public'
    and exists (
      select 1
      from public.watchdog_issues wi
      where wi.id = issue_id
        and wi.status = 'approved'
    )
  );

create policy watchdog_issue_updates_select_author
  on public.watchdog_issue_updates
  for select
  to authenticated
  using (author_user_id = auth.uid());

create policy watchdog_issue_updates_insert_author
  on public.watchdog_issue_updates
  for insert
  to authenticated
  with check (author_user_id = auth.uid());

create policy watchdog_issue_updates_update_author
  on public.watchdog_issue_updates
  for update
  to authenticated
  using (author_user_id = auth.uid())
  with check (author_user_id = auth.uid());

create policy watchdog_issue_updates_delete_author
  on public.watchdog_issue_updates
  for delete
  to authenticated
  using (author_user_id = auth.uid());

create policy watchdog_issue_updates_admin_all
  on public.watchdog_issue_updates
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- C) Extend follow_edges to support watchdog issues
alter table public.follow_edges
  add column if not exists target_issue_id uuid null references public.watchdog_issues(id) on delete cascade;

-- Drop and recreate the target check constraint to include issues
alter table public.follow_edges
  drop constraint if exists follow_edges_target_check;

alter table public.follow_edges
  add constraint follow_edges_target_check
    check (
      (target_type = 'person' and target_person_id is not null and target_org_id is null and target_project_id is null and target_issue_id is null)
      or (target_type = 'org' and target_org_id is not null and target_person_id is null and target_project_id is null and target_issue_id is null)
      or (target_type = 'project' and target_project_id is not null and target_person_id is null and target_org_id is null and target_issue_id is null)
      or (target_type = 'issue' and target_issue_id is not null and target_person_id is null and target_org_id is null and target_project_id is null)
    );

-- Update target_type check constraint
alter table public.follow_edges
  drop constraint if exists follow_edges_target_type_check;

alter table public.follow_edges
  add constraint follow_edges_target_type_check
    check (target_type in ('person', 'org', 'project', 'issue'));

-- Add unique constraint for issue follows
create unique index if not exists follow_edges_unique_issue
  on public.follow_edges (follower_user_id, target_type, target_issue_id)
  where target_issue_id is not null;

-- Add index for issue follows
create index if not exists follow_edges_target_issue_created_at_idx
  on public.follow_edges (target_issue_id, created_at desc);

-- Update follow_edges select policy to prevent leaking unapproved issues
drop policy if exists follow_edges_select_visible on public.follow_edges;

create policy follow_edges_select_visible
  on public.follow_edges
  for select
  using (
    follower_user_id = auth.uid()
    or target_person_id is not null
    or (target_org_id is not null and exists (
      select 1 from public.organisations o where o.id = target_org_id
    ))
    or (target_project_id is not null and exists (
      select 1 from public.projects p where p.id = target_project_id
    ))
    or (target_issue_id is not null and exists (
      select 1 from public.watchdog_issues wi where wi.id = target_issue_id and wi.status = 'approved'
    ))
  );

-- D) Extend activity_feed_items view to include new event types
drop view if exists public.activity_feed_items;

create or replace view public.activity_feed_items
with (security_invoker = true)
as
  -- existing: follow events
  select
    ('follow:' || f.id::text) as id,
    'follow'::text as event_type,
    f.follower_user_id as actor_user_id,
    f.target_project_id as project_id,
    f.target_org_id as org_id,
    f.target_person_id as person_profile_id,
    f.target_issue_id as issue_id,
    null::uuid as grant_id,
    null::uuid as update_id,
    f.created_at as created_at,
    null::text as title,
    null::text as summary
  from public.follow_edges f

  union all

  -- existing: project updates
  select
    ('project_update:' || u.id::text) as id,
    'project_update'::text as event_type,
    u.author_user_id as actor_user_id,
    u.project_id as project_id,
    null::uuid as org_id,
    null::uuid as person_profile_id,
    null::uuid as issue_id,
    null::uuid as grant_id,
    u.id as update_id,
    u.published_at as created_at,
    u.title as title,
    left(u.body, 240) as summary
  from public.project_updates u

  union all

  -- new: org updates
  select
    ('org_update:' || ou.id::text) as id,
    'org_update'::text as event_type,
    ou.author_user_id as actor_user_id,
    null::uuid as project_id,
    ou.organisation_id as org_id,
    null::uuid as person_profile_id,
    null::uuid as issue_id,
    null::uuid as grant_id,
    ou.id as update_id,
    ou.published_at as created_at,
    ou.title as title,
    left(ou.body, 240) as summary
  from public.organisation_updates ou

  union all

  -- new: watchdog issue updates
  select
    ('watchdog_update:' || wu.id::text) as id,
    'watchdog_update'::text as event_type,
    wu.author_user_id as actor_user_id,
    null::uuid as project_id,
    null::uuid as org_id,
    null::uuid as person_profile_id,
    wu.issue_id as issue_id,
    null::uuid as grant_id,
    wu.id as update_id,
    wu.published_at as created_at,
    wu.title as title,
    left(wu.body, 240) as summary
  from public.watchdog_issue_updates wu

  union all

  -- new: grant published events
  select
    ('grant_published:' || g.id::text) as id,
    'grant_published'::text as event_type,
    g.created_by as actor_user_id,
    null::uuid as project_id,
    null::uuid as org_id,
    null::uuid as person_profile_id,
    null::uuid as issue_id,
    g.id as grant_id,
    null::uuid as update_id,
    g.created_at as created_at,
    g.title as title,
    left(g.summary, 240) as summary
  from public.grants g
  where g.is_published = true;

-- E) Extend get_activity_feed_items to support new scopes
drop function if exists public.get_activity_feed_items(text, timestamptz, text, integer);

create or replace function public.get_activity_feed_items(
  scope text,
  cursor_created_at timestamptz default null,
  cursor_id text default null,
  page_size integer default 30
)
returns table (
  id text,
  event_type text,
  actor_user_id uuid,
  project_id uuid,
  org_id uuid,
  person_profile_id uuid,
  issue_id uuid,
  grant_id uuid,
  update_id uuid,
  created_at timestamptz,
  title text,
  summary text
)
language sql
stable
security invoker
set search_path = public, auth
as $$
  with base as (
    select afi.*
    from public.activity_feed_items afi
    where case
      -- existing: global scope
      when scope = 'global' then (
        case
          when afi.event_type = 'project_update' then exists (
            select 1
            from public.project_updates u
            join public.projects p on p.id = u.project_id
            where u.id = afi.update_id
              and u.visibility = 'public'
              and p.status = 'approved'
          )
          when afi.event_type = 'org_update' then exists (
            select 1
            from public.organisation_updates ou
            join public.organisations o on o.id = ou.organisation_id
            where ou.id = afi.update_id
              and ou.visibility = 'public'
              and o.verification_status = 'verified'
          )
          when afi.event_type = 'watchdog_update' then exists (
            select 1
            from public.watchdog_issue_updates wu
            join public.watchdog_issues wi on wi.id = wu.issue_id
            where wu.id = afi.update_id
              and wu.visibility = 'public'
              and wi.status = 'approved'
          )
          when afi.event_type = 'grant_published' then exists (
            select 1
            from public.grants g
            where g.id = afi.grant_id
              and g.is_published = true
          )
          when afi.event_type = 'follow' then (
            afi.person_profile_id is not null
            or exists (
              select 1
              from public.organisations o
              where o.id = afi.org_id
                and o.verification_status = 'verified'
            )
            or exists (
              select 1
              from public.projects p
              where p.id = afi.project_id
                and p.status = 'approved'
            )
            or exists (
              select 1
              from public.watchdog_issues wi
              where wi.id = afi.issue_id
                and wi.status = 'approved'
            )
          )
          else false
        end
      )
      -- existing: for_you scope
      when scope = 'for_you' then (
        (
          afi.event_type = 'project_update'
          and (
            afi.project_id in (
              select f.target_project_id
              from public.follow_edges f
              where f.follower_user_id = auth.uid()
                and f.target_project_id is not null
            )
            or afi.project_id in (
              select p.id
              from public.projects p
              where p.lead_org_id in (
                select f.target_org_id
                from public.follow_edges f
                where f.follower_user_id = auth.uid()
                  and f.target_org_id is not null
              )
            )
            or afi.actor_user_id in (
              select f.target_person_id
              from public.follow_edges f
              where f.follower_user_id = auth.uid()
                and f.target_person_id is not null
            )
          )
        )
        or (
          afi.event_type = 'org_update'
          and (
            afi.org_id in (
              select f.target_org_id
              from public.follow_edges f
              where f.follower_user_id = auth.uid()
                and f.target_org_id is not null
            )
            or afi.actor_user_id in (
              select f.target_person_id
              from public.follow_edges f
              where f.follower_user_id = auth.uid()
                and f.target_person_id is not null
            )
          )
        )
        or (
          afi.event_type = 'watchdog_update'
          and (
            afi.issue_id in (
              select f.target_issue_id
              from public.follow_edges f
              where f.follower_user_id = auth.uid()
                and f.target_issue_id is not null
            )
            or afi.actor_user_id in (
              select f.target_person_id
              from public.follow_edges f
              where f.follower_user_id = auth.uid()
                and f.target_person_id is not null
            )
          )
        )
        or (
          afi.event_type = 'follow'
          and afi.actor_user_id in (
            select f.target_person_id
            from public.follow_edges f
            where f.follower_user_id = auth.uid()
              and f.target_person_id is not null
          )
        )
      )
      -- new: watchdog scope
      when scope = 'watchdog' then (
        case
          when afi.event_type = 'watchdog_update' then exists (
            select 1
            from public.watchdog_issue_updates wu
            join public.watchdog_issues wi on wi.id = wu.issue_id
            where wu.id = afi.update_id
              and wu.visibility = 'public'
              and wi.status = 'approved'
          )
          else false
        end
      )
      -- new: funding scope
      when scope = 'funding' then (
        case
          when afi.event_type = 'grant_published' then exists (
            select 1
            from public.grants g
            where g.id = afi.grant_id
              and g.is_published = true
          )
          else false
        end
      )
      else false
    end
  )
  select *
  from base
  where (
    cursor_created_at is null
    or created_at < cursor_created_at
    or (created_at = cursor_created_at and id < cursor_id)
  )
  order by created_at desc, id desc
  limit greatest(1, least(page_size, 50));
$$;

grant select on public.activity_feed_items to anon, authenticated;
grant execute on function public.get_activity_feed_items(text, timestamptz, text, integer) to anon, authenticated;
