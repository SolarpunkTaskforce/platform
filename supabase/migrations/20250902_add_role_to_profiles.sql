-- Add role column to profiles if it doesn't already exist
alter table public.profiles
  add column if not exists role text not null default 'user';

-- Optionally mark specific users as admins
-- update public.profiles set role = 'admin' where email = 'your_admin@example.com';