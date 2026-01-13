begin;

-- Ensure the directory view is selectable (idempotent)
grant select on public.organisations_directory_v1 to anon, authenticated;

-- The directory view counts followers/projects via subqueries.
-- If anon/authenticated lacks table privileges, selecting the view can error in PostgREST.
-- RLS still applies; this only grants table-level SELECT privilege.
grant select on public.follow_edges to anon, authenticated;
grant select on public.projects to anon, authenticated;

commit;
