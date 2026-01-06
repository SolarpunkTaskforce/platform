-- Add a category to every project so we can split maps + admin review flows.
-- Values: 'humanitarian' | 'environmental'

alter table public.projects
add column if not exists category text;

-- Backfill existing rows (so old projects don’t become “unknown”)
update public.projects
set category = 'environmental'
where category is null;

-- Enforce allowed values
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_category_check'
  ) then
    alter table public.projects
      add constraint projects_category_check
      check (category in ('humanitarian', 'environmental'));
  end if;
end $$;

-- Make it required + set a default for future inserts (registration form will explicitly set it too)
alter table public.projects
  alter column category set default 'environmental',
  alter column category set not null;

-- Optional but helpful for performance (filtering approved projects by category)
create index if not exists projects_category_status_idx
  on public.projects (category, status);
