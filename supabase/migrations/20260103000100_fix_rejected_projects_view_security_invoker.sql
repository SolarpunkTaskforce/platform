drop view if exists public.rejected_projects;

create view public.rejected_projects
with (security_invoker = true)
as
select *
from public.projects
where status = 'rejected';

grant select on public.rejected_projects to anon, authenticated;