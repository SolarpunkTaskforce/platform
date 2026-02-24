-- Migration: notifications_for_reactions_comments
-- Created: 2026-02-24T12:30:00.000Z
--
-- Phase 6: Notify post authors when someone likes or comments on their posts
--
-- SECURITY:
-- - Trigger functions run as SECURITY DEFINER to insert notifications directly
-- - Cannot be spoofed from client (triggers only fire on actual DB operations)
-- - RLS on notifications ensures only recipients can read their notifications
-- - Authors don't get notified for their own actions (self-like, self-comment)
--
-- DESIGN DECISIONS:
-- - No deduplication for reactions: each like/unlike creates/removes a notification
-- - Comment notifications always created (no deduplication needed - each comment is unique)
-- - Notifications link to the post via href for easy navigation

begin;

-- 1) Create trigger function to notify post author on new comment
create or replace function public.notify_post_author_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  post_author_id uuid;
  commenter_name text;
  post_preview text;
begin
  -- Get the post author (created_by from feed_posts)
  select fp.created_by
    into post_author_id
  from public.feed_posts fp
  where fp.id = new.post_id;

  -- Don't notify if the post author doesn't exist (shouldn't happen due to FK)
  if post_author_id is null then
    return new;
  end if;

  -- Don't notify if author is commenting on their own post
  if post_author_id = new.created_by then
    return new;
  end if;

  -- Get commenter's name for notification
  -- If commenting as org, use org name; otherwise use user's name
  if new.author_organisation_id is not null then
    select o.name
      into commenter_name
    from public.organisations o
    where o.id = new.author_organisation_id;
  else
    select coalesce(
      nullif(trim(p.first_name || ' ' || p.last_name), ''),
      split_part(u.email, '@', 1)
    )
      into commenter_name
    from auth.users u
    left join public.profiles p on p.id = u.id
    where u.id = new.created_by;
  end if;

  -- Get a preview of the post content (first 50 chars)
  select left(fp.content, 50)
    into post_preview
  from public.feed_posts fp
  where fp.id = new.post_id;

  -- Insert notification for post author
  insert into public.notifications(user_id, type, title, body, href, metadata)
  values (
    post_author_id,
    'feed_post_comment',
    coalesce(commenter_name, 'Someone') || ' commented on your post',
    case
      when length(post_preview) < 50 then post_preview
      else post_preview || '...'
    end,
    '/feed?post=' || new.post_id::text,
    jsonb_build_object(
      'post_id', new.post_id,
      'comment_id', new.id,
      'commenter_id', new.created_by,
      'commenter_org_id', new.author_organisation_id
    )
  );

  return new;
end;
$$;

-- 2) Create trigger on feed_post_comments
drop trigger if exists trg_notify_post_author_on_comment on public.feed_post_comments;

create trigger trg_notify_post_author_on_comment
after insert
on public.feed_post_comments
for each row
execute function public.notify_post_author_on_comment();

-- 3) Create trigger function to notify post author on new reaction
create or replace function public.notify_post_author_on_reaction()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  post_author_id uuid;
  reactor_name text;
  post_preview text;
begin
  -- Get the post author (created_by from feed_posts)
  select fp.created_by
    into post_author_id
  from public.feed_posts fp
  where fp.id = new.post_id;

  -- Don't notify if the post author doesn't exist (shouldn't happen due to FK)
  if post_author_id is null then
    return new;
  end if;

  -- Don't notify if author is reacting to their own post
  if post_author_id = new.user_id then
    return new;
  end if;

  -- Get reactor's name for notification
  select coalesce(
    nullif(trim(p.first_name || ' ' || p.last_name), ''),
    split_part(u.email, '@', 1)
  )
    into reactor_name
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = new.user_id;

  -- Get a preview of the post content (first 50 chars)
  select left(fp.content, 50)
    into post_preview
  from public.feed_posts fp
  where fp.id = new.post_id;

  -- Insert notification for post author
  insert into public.notifications(user_id, type, title, body, href, metadata)
  values (
    post_author_id,
    'feed_post_reaction',
    coalesce(reactor_name, 'Someone') || ' liked your post',
    case
      when length(post_preview) < 50 then post_preview
      else post_preview || '...'
    end,
    '/feed?post=' || new.post_id::text,
    jsonb_build_object(
      'post_id', new.post_id,
      'reaction_id', new.id,
      'reactor_id', new.user_id,
      'reaction_type', new.reaction_type
    )
  );

  return new;
end;
$$;

-- 4) Create trigger on feed_post_reactions
drop trigger if exists trg_notify_post_author_on_reaction on public.feed_post_reactions;

create trigger trg_notify_post_author_on_reaction
after insert
on public.feed_post_reactions
for each row
execute function public.notify_post_author_on_reaction();

commit;
