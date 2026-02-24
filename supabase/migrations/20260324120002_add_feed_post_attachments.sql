-- Migration: add_feed_post_attachments
-- Created: 2026-02-24
--
-- Phase 5: Add image attachments for feed posts
--
-- TABLES:
-- 1. feed_post_attachments: stores metadata for images attached to posts
--
-- STORAGE:
-- 2. feed-posts bucket: stores actual image files
--
-- POLICIES EXPLANATION:
-- 1. SELECT: Allow reading attachments only if the parent post is readable
--    This delegates to feed_posts RLS to respect visibility (public/followers)
-- 2. INSERT: Authenticated users can insert if:
--    - They created the parent post (created_by = auth.uid()), OR
--    - If post was authored as org: current user is owner/admin of that org
-- 3. DELETE: Same as INSERT (only post author or org admin can delete attachments)
--
-- SECURITY:
-- - Users can only attach images to their own posts
-- - Deleting a post cascades attachments (on delete cascade on post_id FK)
-- - RLS prevents reading attachments for non-visible posts
-- - Storage policies restrict uploads to authorized users only
-- - Anonymous users can view attachments for public posts

begin;

-- 1) Create feed_post_attachments table
create table public.feed_post_attachments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  file_path text not null,
  mime_type text not null,
  file_size bigint not null,
  created_at timestamptz not null default now()
);

-- 2) Add constraints
-- Mime type check: only allow common image formats
alter table public.feed_post_attachments
  add constraint feed_post_attachments_mime_type_check
  check (mime_type in ('image/jpeg', 'image/png', 'image/gif', 'image/webp'));

-- File size check: max 10MB per image
alter table public.feed_post_attachments
  add constraint feed_post_attachments_file_size_check
  check (file_size > 0 and file_size <= 10485760);

-- 3) Add indexes for performance
-- Index on post_id for querying attachments per post
create index feed_post_attachments_post_id_idx
  on public.feed_post_attachments (post_id);

-- 4) Enable RLS
alter table public.feed_post_attachments enable row level security;

-- 5) SELECT policy: allow reading attachments only if the parent post is readable
-- This delegates to feed_posts RLS which handles visibility (public/followers)
drop policy if exists "feed_post_attachments_select_readable" on public.feed_post_attachments;
create policy "feed_post_attachments_select_readable"
  on public.feed_post_attachments
  for select
  using (
    exists (
      select 1
      from public.feed_posts fp
      where fp.id = feed_post_attachments.post_id
      -- The feed_posts RLS policy will automatically filter based on visibility
    )
  );

-- 6) INSERT policy: authenticated users can insert if they own the parent post
--    or if post was authored as org and they are owner/admin of that org
drop policy if exists "feed_post_attachments_insert_auth" on public.feed_post_attachments;
create policy "feed_post_attachments_insert_auth"
  on public.feed_post_attachments
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.feed_posts fp
      where fp.id = feed_post_attachments.post_id
        and fp.created_by = auth.uid()
        and (
          fp.author_organisation_id is null
          or exists (
            select 1
            from public.organisation_members om
            where om.organisation_id = fp.author_organisation_id
              and om.user_id = auth.uid()
              and om.role in ('owner', 'admin')
          )
        )
    )
  );

-- 7) DELETE policy: same as INSERT
drop policy if exists "feed_post_attachments_delete_auth" on public.feed_post_attachments;
create policy "feed_post_attachments_delete_auth"
  on public.feed_post_attachments
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.feed_posts fp
      where fp.id = feed_post_attachments.post_id
        and fp.created_by = auth.uid()
        and (
          fp.author_organisation_id is null
          or exists (
            select 1
            from public.organisation_members om
            where om.organisation_id = fp.author_organisation_id
              and om.user_id = auth.uid()
              and om.role in ('owner', 'admin')
          )
        )
    )
  );

-- 8) Grant permissions
-- Authenticated users can select, insert, and delete
grant select, insert, delete on public.feed_post_attachments to authenticated;

-- Anonymous users can only select (read) attachments
grant select on public.feed_post_attachments to anon;

-- 9) Create storage bucket for feed post images
insert into storage.buckets (id, name, public)
values ('feed-posts', 'feed-posts', true)
on conflict (id) do nothing;

-- 10) Storage policies for the feed-posts bucket
-- Allow authenticated users to upload files
drop policy if exists "feed_posts_upload_auth" on storage.objects;
create policy "feed_posts_upload_auth"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'feed-posts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow anyone to view files (public bucket)
drop policy if exists "feed_posts_select_public" on storage.objects;
create policy "feed_posts_select_public"
  on storage.objects
  for select
  using (bucket_id = 'feed-posts');

-- Allow authenticated users to delete their own files
drop policy if exists "feed_posts_delete_auth" on storage.objects;
create policy "feed_posts_delete_auth"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'feed-posts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

commit;
