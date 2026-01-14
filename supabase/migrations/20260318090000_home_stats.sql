-- Home page stats aggregates

create or replace function public.get_home_stats()
returns table (
  updated_at timestamptz,
  projects_projects_approved bigint,
  projects_projects_ongoing bigint,
  projects_organisations_registered bigint,
  projects_donations_received_eur numeric,
  funding_opportunities_total bigint,
  funding_funders_registered bigint,
  funding_open_calls bigint,
  issues_issues_total bigint,
  issues_issues_open bigint
)
language sql
stable
security invoker
as $$
  select
    now() as updated_at,
    (
      select count(*)
      from public.projects
      where status = 'approved'
    ) as projects_projects_approved,
    (
      select count(*)
      from public.projects
      where status = 'approved'
        and (end_date is null or end_date >= current_date)
    ) as projects_projects_ongoing,
    (
      select count(*)
      from public.organisations
      where verification_status = 'verified'
    ) as projects_organisations_registered,
    (
      select coalesce(sum(donations_received), 0)
      from public.projects
      where status = 'approved'
        and currency = 'EUR'
    ) as projects_donations_received_eur,
    (
      select count(*)
      from public.grants
      where is_published = true
        and status in ('open', 'rolling')
    ) as funding_opportunities_total,
    (
      select count(distinct funder_name)
      from public.grants
      where is_published = true
        and status in ('open', 'rolling')
        and funder_name is not null
        and funder_name <> ''
    ) as funding_funders_registered,
    (
      select count(*)
      from public.grants
      where is_published = true
        and status = 'open'
    ) as funding_open_calls,
    (
      select count(*)
      from public.watchdog_issues
      where status = 'approved'
    ) as issues_issues_total,
    (
      select count(*)
      from public.watchdog_issues
      where status = 'approved'
        and urgency >= 4
    ) as issues_issues_open;
$$;

grant execute on function public.get_home_stats() to anon, authenticated;
