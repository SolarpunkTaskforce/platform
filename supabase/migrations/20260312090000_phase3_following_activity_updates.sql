-- Phase 3: following, project updates, activity feed

create table if not exists public.follow_edges (
  id uuid primary key default gen_random_uuid(),
  follower_user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('person', 'org', 'project')),
  target_person_id uuid null references public.profiles(id) on delete cascade,
  target_org_id uuid null references public.organisations(id) on delete cascade,
  target_project_id uuid null references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint follow_edges_target_check
    check (
      (target_type = 'person' and target_person_id is not null and target_org_id is null and target_project_id is null)
      or (target_type = 'org' and target_org_id is not null and target_person_id is null and target_project_id is null)
      or (target_type = 'project' and target_project_id is not null and target_person_id is null and target_org_id is null)
    ),
  constraint follow_edges_unique_person unique (follower_user_id, target_type, target_person_id),
  constraint follow_edges_unique_org unique (follower_user_id, target_type, target_org_id),
  constraint follow_edges_unique_project unique (follower_user_id, target_type, target_project_id)
);

create index if not exists follow_edges_follower_created_at_idx
  on public.follow_edges (follower_user_id, created_at desc);

create index if not exists follow_edges_target_person_created_at_idx
  on public.follow_edges (target_person_id, created_at desc);

create index if not exists follow_edges_target_org_created_at_idx
  on public.follow_edges (target_org_id, created_at desc);

create index if not exists follow_edges_target_project_created_at_idx
  on public.follow_edges (target_project_id, created_at desc);

alter table public.follow_edges enable row level security;

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
  );

create policy follow_edges_insert_self
  on public.follow_edges
  for insert
  to authenticated
  with check (follower_user_id = auth.uid());

create policy follow_edges_delete_self
  on public.follow_edges
  for delete
  to authenticated
  using (follower_user_id = auth.uid());

create table if not exists public.project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete restrict,
  title text not null,
  body text not null,
  visibility text not null default 'project' check (visibility in ('public', 'project')),
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists project_updates_project_published_idx
  on public.project_updates (project_id, published_at desc);

create index if not exists project_updates_author_published_idx
  on public.project_updates (author_user_id, published_at desc);

alter table public.project_updates enable row level security;

create or replace function public.user_can_view_project_private(pid uuid)
returns boolean
language sql
stable
set search_path to ''
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.projects p
      where p.id = pid
        and p.owner_id = auth.uid()
    )
    or exists (
      select 1
      from public.project_collaborators c
      where c.project_id = pid
        and c.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.project_shares s
      where s.project_id = pid
        and s.user_id = auth.uid()
    );
$$;

create policy project_updates_select_visible
  on public.project_updates
  for select
  using (
    (visibility = 'public' and public.user_can_view_project(project_id))
    or (visibility = 'project' and public.user_can_view_project_private(project_id))
  );

create policy project_updates_insert_editors
  on public.project_updates
  for insert
  to authenticated
  with check (
    author_user_id = auth.uid()
    and public.user_can_edit_project(project_id)
  );

create policy project_updates_update_editors_or_author
  on public.project_updates
  for update
  to authenticated
  using (
    public.user_can_edit_project(project_id)
    or author_user_id = auth.uid()
  )
  with check (
    public.user_can_edit_project(project_id)
    or author_user_id = auth.uid()
  );

create policy project_updates_delete_editors_or_author
  on public.project_updates
  for delete
  to authenticated
  using (
    public.user_can_edit_project(project_id)
    or author_user_id = auth.uid()
  );

create or replace view public.activity_feed_items
with (security_invoker = true)
as
  select
    ('follow:' || f.id::text) as id,
    'follow'::text as event_type,
    f.follower_user_id as actor_user_id,
    f.target_project_id as project_id,
    f.target_org_id as org_id,
    f.target_person_id as person_profile_id,
    null::uuid as update_id,
    f.created_at as created_at,
    null::text as title,
    null::text as summary
  from public.follow_edges f

  union all

  select
    ('update:' || u.id::text) as id,
    'project_update'::text as event_type,
    u.author_user_id as actor_user_id,
    u.project_id as project_id,
    null::uuid as org_id,
    null::uuid as person_profile_id,
    u.id as update_id,
    u.published_at as created_at,
    u.title as title,
    left(u.body, 240) as summary
  from public.project_updates u;

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
          )
          else false
        end
      )
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
          afi.event_type = 'follow'
          and afi.actor_user_id in (
            select f.target_person_id
            from public.follow_edges f
            where f.follower_user_id = auth.uid()
              and f.target_person_id is not null
          )
        )
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

create or replace function public.notify_follow_edge_insert()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  follower_name text;
  target_allows_email boolean;
begin
  if new.target_type <> 'person' or new.target_person_id is null then
    return new;
  end if;

  if new.follower_user_id = new.target_person_id then
    return new;
  end if;

  select p.email_notifications_enabled
    into target_allows_email
  from public.profiles p
  where p.id = new.target_person_id;

  if target_allows_email is false then
    return new;
  end if;

  select concat_ws(' ', p.first_name, p.last_name)
    into follower_name
  from public.profiles p
  where p.id = new.follower_user_id;

  insert into public.notifications (user_id, type, title, body, href, metadata)
  values (
    new.target_person_id,
    'followed_you',
    coalesce(nullif(follower_name, ''), 'Someone') || ' followed you',
    null,
    '/people/' || new.follower_user_id::text,
    jsonb_build_object('follower_user_id', new.follower_user_id)
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_follow_edge_insert on public.follow_edges;

create trigger trg_notify_follow_edge_insert
after insert on public.follow_edges
for each row
execute function public.notify_follow_edge_insert();

create or replace function public.notify_project_update_published()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  project_name text;
  project_slug text;
begin
  select p.name, coalesce(p.slug, p.id::text)
    into project_name, project_slug
  from public.projects p
  where p.id = new.project_id;

  if project_name is null then
    return new;
  end if;

  insert into public.notifications (user_id, type, title, body, href, metadata)
  select
    f.follower_user_id,
    'project_update_published',
    'New update from ' || project_name,
    new.title,
    '/projects/' || project_slug,
    jsonb_build_object('project_id', new.project_id, 'update_id', new.id)
  from public.follow_edges f
  left join public.profiles p on p.id = f.follower_user_id
  where f.target_type = 'project'
    and f.target_project_id = new.project_id
    and f.follower_user_id <> new.author_user_id
    and (p.email_notifications_enabled is true or p.email_notifications_enabled is null)
    and (
      (new.visibility = 'public' and (
        exists (select 1 from public.projects pr where pr.id = new.project_id and pr.status = 'approved')
        or exists (select 1 from public.projects pr where pr.id = new.project_id and pr.owner_id = f.follower_user_id)
        or exists (select 1 from public.project_collaborators c where c.project_id = new.project_id and c.user_id = f.follower_user_id)
        or exists (select 1 from public.project_shares s where s.project_id = new.project_id and s.user_id = f.follower_user_id)
      ))
      or (new.visibility = 'project' and (
        exists (select 1 from public.projects pr where pr.id = new.project_id and pr.owner_id = f.follower_user_id)
        or exists (select 1 from public.project_collaborators c where c.project_id = new.project_id and c.user_id = f.follower_user_id)
        or exists (select 1 from public.project_shares s where s.project_id = new.project_id and s.user_id = f.follower_user_id)
      ))
    );

  return new;
end;
$$;

drop trigger if exists trg_notify_project_update_published on public.project_updates;

create trigger trg_notify_project_update_published
after insert on public.project_updates
for each row
execute function public.notify_project_update_published();

-- Assertions (manual):
-- select * from public.activity_feed_items limit 5;
-- select public.user_can_view_project_private('<project-id>'::uuid);
