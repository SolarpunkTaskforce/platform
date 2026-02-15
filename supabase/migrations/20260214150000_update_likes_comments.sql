-- Phase 2: Social features - likes and comments on project_updates

-- Table: update_likes
-- Stores likes on project updates with polymorphic support for future update types
create table if not exists public.update_likes (
  id uuid primary key default gen_random_uuid(),
  update_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Unique constraint: one like per user per update
  constraint update_likes_unique unique (update_id, user_id)
);

create index if not exists update_likes_update_id_idx
  on public.update_likes (update_id);

create index if not exists update_likes_user_id_idx
  on public.update_likes (user_id);

alter table public.update_likes enable row level security;

-- RLS policies for update_likes
-- Anyone can read likes
create policy update_likes_select_all
  on public.update_likes
  for select
  using (true);

-- Authenticated users can insert their own likes
create policy update_likes_insert_self
  on public.update_likes
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Authenticated users can delete their own likes
create policy update_likes_delete_self
  on public.update_likes
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Table: update_comments
-- Stores comments on project updates with polymorphic support for future update types
create table if not exists public.update_comments (
  id uuid primary key default gen_random_uuid(),
  update_id uuid not null,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) > 0 and char_length(body) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists update_comments_update_id_created_at_idx
  on public.update_comments (update_id, created_at desc);

create index if not exists update_comments_author_user_id_idx
  on public.update_comments (author_user_id);

alter table public.update_comments enable row level security;

-- RLS policies for update_comments
-- Anyone can read comments
create policy update_comments_select_all
  on public.update_comments
  for select
  using (true);

-- Authenticated users can insert comments
create policy update_comments_insert_authenticated
  on public.update_comments
  for insert
  to authenticated
  with check (author_user_id = auth.uid());

-- Users can update their own comments
create policy update_comments_update_self
  on public.update_comments
  for update
  to authenticated
  using (author_user_id = auth.uid())
  with check (author_user_id = auth.uid());

-- Users can delete their own comments, or admins can delete any comment
create policy update_comments_delete_self_or_admin
  on public.update_comments
  for delete
  to authenticated
  using (
    author_user_id = auth.uid()
    or public.is_admin()
  );

-- Trigger: update updated_at timestamp on comment updates
create or replace function public.update_comments_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_update_comments_updated_at on public.update_comments;

create trigger trg_update_comments_updated_at
before update on public.update_comments
for each row
execute function public.update_comments_updated_at();

-- Grant permissions
grant select, insert, delete on public.update_likes to authenticated;
grant select on public.update_likes to anon;

grant select, insert, update, delete on public.update_comments to authenticated;
grant select on public.update_comments to anon;
