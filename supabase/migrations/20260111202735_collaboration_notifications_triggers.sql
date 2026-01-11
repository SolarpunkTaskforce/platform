-- Notify users when project_collaborators changes (added/role changed/removed)

create or replace function public.notify_project_collaboration_change()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  proj_name text;
  proj_slug text;
  notif_type text;
  notif_title text;
  notif_body text;
  notif_href text;
begin
  -- Fetch project info
  select p.name, coalesce(p.slug, p.id::text)
    into proj_name, proj_slug
  from public.projects p
  where p.id = coalesce(new.project_id, old.project_id);

  if proj_name is null then
    -- project missing; do nothing
    return coalesce(new, old);
  end if;

  -- Determine event
  if tg_op = 'INSERT' then
    notif_type := 'project_collab_added';
    notif_title := 'You were added to ' || proj_name;
    notif_body := 'You now have ' || new.role || ' access.';
    notif_href := case when new.role = 'editor'
      then '/projects/' || proj_slug || '/edit#sharing'
      else '/projects/' || proj_slug
    end;

    insert into public.notifications(user_id, type, title, body, href, metadata)
    values (new.user_id, notif_type, notif_title, notif_body, notif_href,
      jsonb_build_object('project_id', new.project_id, 'role', new.role));

    return new;
  end if;

  if tg_op = 'UPDATE' then
    -- only notify if role actually changed
    if new.role is distinct from old.role then
      notif_type := 'project_collab_role_changed';
      notif_title := 'Your access changed for ' || proj_name;
      notif_body := 'You are now an ' || new.role || '.';
      notif_href := case when new.role = 'editor'
        then '/projects/' || proj_slug || '/edit#sharing'
        else '/projects/' || proj_slug
      end;

      insert into public.notifications(user_id, type, title, body, href, metadata)
      values (new.user_id, notif_type, notif_title, notif_body, notif_href,
        jsonb_build_object('project_id', new.project_id, 'role', new.role));

    end if;

    return new;
  end if;

  if tg_op = 'DELETE' then
    notif_type := 'project_collab_removed';
    notif_title := 'You were removed from ' || proj_name;
    notif_body := 'Your access to this project was removed.';
    notif_href := '/projects/' || proj_slug;

    insert into public.notifications(user_id, type, title, body, href, metadata)
    values (old.user_id, notif_type, notif_title, notif_body, notif_href,
      jsonb_build_object('project_id', old.project_id));

    return old;
  end if;

  return coalesce(new, old);
end;
$$;

-- Trigger: after insert/update/delete on collaborators
drop trigger if exists trg_notify_project_collaboration_change on public.project_collaborators;

create trigger trg_notify_project_collaboration_change
after insert or update or delete
on public.project_collaborators
for each row
execute function public.notify_project_collaboration_change();
