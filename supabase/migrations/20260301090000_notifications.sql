-- Notifications

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text null,
  href text null,
  metadata jsonb null,
  created_at timestamptz not null default now(),
  read_at timestamptz null
);

create index if not exists notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_id_unread_idx
  on public.notifications (user_id)
  where read_at is null;

alter table public.notifications enable row level security;

create policy notifications_select_own
  on public.notifications
  for select
  to authenticated
  using (user_id = auth.uid());

create policy notifications_update_own
  on public.notifications
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.get_unread_notification_count()
returns integer
language sql
stable
security definer
set search_path = public, auth
as $$
  select count(*)::integer
  from public.notifications
  where user_id = auth.uid()
    and read_at is null;
$$;

create or replace function public.mark_notification_read(nid uuid)
returns void
language sql
security definer
set search_path = public, auth
as $$
  update public.notifications
  set read_at = now()
  where id = nid
    and user_id = auth.uid();
$$;

create or replace function public.mark_all_notifications_read()
returns void
language sql
security definer
set search_path = public, auth
as $$
  update public.notifications
  set read_at = now()
  where user_id = auth.uid()
    and read_at is null;
$$;

create or replace function public.create_notification(
  user_id uuid,
  type text,
  title text,
  body text,
  href text,
  metadata jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  new_id uuid;
begin
  if not public.is_admin() then
    raise exception 'not allowed';
  end if;

  insert into public.notifications (user_id, type, title, body, href, metadata)
  values (user_id, type, title, body, href, metadata)
  returning id into new_id;

  return new_id;
end;
$$;

create or replace function public.add_project_collaborator_by_email(
  pid uuid,
  email text,
  role text
)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_id uuid;
  normalized_role text := lower(coalesce(role, 'viewer'));
  existing_role text;
  project_name text;
  project_slug text;
  notification_type text;
  notification_title text;
  notification_href text;
begin
  if normalized_role not in ('viewer', 'editor') then
    return 'not_allowed';
  end if;

  if not public.user_can_edit_project(pid) then
    return 'not_allowed';
  end if;

  select u.id
  into target_id
  from auth.users u
  where lower(u.email) = lower(email)
  limit 1;

  if target_id is null then
    return 'not_found';
  end if;

  select c.role
  into existing_role
  from public.project_collaborators c
  where c.project_id = pid
    and c.user_id = target_id;

  insert into public.project_collaborators (project_id, user_id, role, created_by)
  values (pid, target_id, normalized_role, auth.uid())
  on conflict (project_id, user_id)
  do update set role = excluded.role;

  if public.is_admin() then
    select p.name, p.slug
    into project_name, project_slug
    from public.projects p
    where p.id = pid;

    if existing_role is null then
      notification_type := 'project_collab_added';
      notification_title := format('You were added to %s', coalesce(project_name, 'a project'));
    elsif existing_role <> normalized_role then
      notification_type := 'project_collab_role_changed';
      notification_title := format('Your role was updated for %s', coalesce(project_name, 'a project'));
    end if;

    if notification_type is not null then
      if normalized_role = 'editor' then
        notification_href := format('/projects/%s/edit#sharing', coalesce(project_slug, pid::text));
      else
        notification_href := format('/projects/%s', coalesce(project_slug, pid::text));
      end if;

      perform public.create_notification(
        target_id,
        notification_type,
        notification_title,
        null,
        notification_href,
        null
      );
    end if;
  end if;

  return 'ok';
end;
$$;

create or replace function public.remove_project_collaborator(
  pid uuid,
  target_id uuid
)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  existing_role text;
  project_name text;
  project_slug text;
  notification_title text;
  notification_href text;
begin
  if not (public.user_can_edit_project(pid) or target_id = auth.uid()) then
    return 'not_allowed';
  end if;

  select c.role
  into existing_role
  from public.project_collaborators c
  where c.project_id = pid
    and c.user_id = target_id;

  if existing_role is null then
    return 'not_found';
  end if;

  delete from public.project_collaborators
  where project_id = pid
    and user_id = target_id;

  if public.is_admin() then
    select p.name, p.slug
    into project_name, project_slug
    from public.projects p
    where p.id = pid;

    notification_title := format('You were removed from %s', coalesce(project_name, 'a project'));

    if existing_role = 'editor' then
      notification_href := format('/projects/%s/edit#sharing', coalesce(project_slug, pid::text));
    else
      notification_href := format('/projects/%s', coalesce(project_slug, pid::text));
    end if;

    perform public.create_notification(
      target_id,
      'project_collab_removed',
      notification_title,
      null,
      notification_href,
      null
    );
  end if;

  return 'ok';
end;
$$;

grant execute on function public.get_unread_notification_count() to authenticated;
grant execute on function public.mark_notification_read(uuid) to authenticated;
grant execute on function public.mark_all_notifications_read() to authenticated;
grant execute on function public.create_notification(uuid, text, text, text, text, jsonb) to authenticated;
grant execute on function public.remove_project_collaborator(uuid, uuid) to authenticated;
