-- Ensure organisations table exists
create table if not exists public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

-- Projects table and columns
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  lead_org_id uuid references public.organisations(id),
  lat double precision,
  lng double precision,
  place_name text,
  type_of_intervention text[],
  target_demographic text,
  lives_improved integer,
  start_date date,
  end_date date,
  thematic_area text[],
  donations_received numeric,
  amount_needed numeric,
  currency text default 'USD',
  status text default 'pending' check (status in ('pending','approved','rejected')),
  created_by uuid default auth.uid(),
  created_at timestamptz default now()
);

-- Rename / add columns for existing projects table
DO $$
BEGIN
  -- rename title -> name
  IF exists (select 1 from information_schema.columns where table_name='projects' and column_name='title')
     AND not exists (select 1 from information_schema.columns where table_name='projects' and column_name='name') THEN
    ALTER TABLE public.projects RENAME COLUMN title TO name;
  END IF;
  -- ensure name column exists
  IF not exists (select 1 from information_schema.columns where table_name='projects' and column_name='name') THEN
    ALTER TABLE public.projects ADD COLUMN name text;
  END IF;
  -- enforce non-null name
  UPDATE public.projects SET name = coalesce(name, 'Untitled project') WHERE name IS NULL;
  ALTER TABLE public.projects ALTER COLUMN name SET NOT NULL;
  -- rename old status to lifecycle_status if approval_status also exists
  IF exists (select 1 from information_schema.columns where table_name='projects' and column_name='status')
     AND exists (select 1 from information_schema.columns where table_name='projects' and column_name='approval_status') THEN
    ALTER TABLE public.projects RENAME COLUMN status TO lifecycle_status;
  END IF;
  -- rename approval_status -> status
  IF exists (select 1 from information_schema.columns where table_name='projects' and column_name='approval_status') THEN
    ALTER TABLE public.projects RENAME COLUMN approval_status TO status;
    ALTER TABLE public.projects ALTER COLUMN status TYPE text USING status::text;
    ALTER TABLE public.projects ALTER COLUMN status SET DEFAULT 'pending';
    ALTER TABLE public.projects ADD CONSTRAINT projects_status_check CHECK (status in ('pending','approved','rejected'));
  END IF;
  -- rename funding_needed -> amount_needed
  IF exists (select 1 from information_schema.columns where table_name='projects' and column_name='funding_needed')
     AND not exists (select 1 from information_schema.columns where table_name='projects' and column_name='amount_needed') THEN
    ALTER TABLE public.projects RENAME COLUMN funding_needed TO amount_needed;
  END IF;
  -- add description
  IF not exists (select 1 from information_schema.columns where table_name='projects' and column_name='description') THEN
    ALTER TABLE public.projects ADD COLUMN description text;
  END IF;
  -- add lead_org_id
  IF not exists (select 1 from information_schema.columns where table_name='projects' and column_name='lead_org_id') THEN
    ALTER TABLE public.projects ADD COLUMN lead_org_id uuid references public.organisations(id);
  END IF;
  -- add lat/lng
  IF not exists (select 1 from information_schema.columns where table_name='projects' and column_name='lat') THEN
    ALTER TABLE public.projects ADD COLUMN lat double precision;
  END IF;
  IF not exists (select 1 from information_schema.columns where table_name='projects' and column_name='lng') THEN
    ALTER TABLE public.projects ADD COLUMN lng double precision;
  END IF;
  -- add place_name
  IF not exists (select 1 from information_schema.columns where table_name='projects' and column_name='place_name') THEN
    ALTER TABLE public.projects ADD COLUMN place_name text;
  END IF;
  -- add type_of_intervention
  IF not exists (select 1 from information_schema.columns where table_name='projects' and column_name='type_of_intervention') THEN
    ALTER TABLE public.projects ADD COLUMN type_of_intervention text[];
  END IF;
  -- add target_demographic
  IF not exists (select 1 from information_schema.columns where table_name='projects' and column_name='target_demographic') THEN
    ALTER TABLE public.projects ADD COLUMN target_demographic text;
  END IF;
  -- add lives_improved
  IF not exists (select 1 from information_schema.columns where table_name='projects' and column_name='lives_improved') THEN
    ALTER TABLE public.projects ADD COLUMN lives_improved integer;
  END IF;
  -- add start/end dates
  IF not exists (select 1 from information_schema.columns where table_name='projects' and column_name='start_date') THEN
    ALTER TABLE public.projects ADD COLUMN start_date date;
  END IF;
  IF not exists (select 1 from information_schema.columns where table_name='projects' and column_name='end_date') THEN
    ALTER TABLE public.projects ADD COLUMN end_date date;
  END IF;
  -- ensure thematic_area is text[]
  IF exists (select 1 from information_schema.columns where table_name='projects' and column_name='thematic_area') THEN
    IF (select data_type from information_schema.columns where table_name='projects' and column_name='thematic_area') <> 'ARRAY' THEN
      ALTER TABLE public.projects ALTER COLUMN thematic_area TYPE text[] USING ARRAY[thematic_area];
    END IF;
  ELSE
    ALTER TABLE public.projects ADD COLUMN thematic_area text[];
  END IF;
  -- donations_received
  IF not exists (select 1 from information_schema.columns where table_name='projects' and column_name='donations_received') THEN
    ALTER TABLE public.projects ADD COLUMN donations_received numeric;
  END IF;
  -- amount_needed
  IF not exists (select 1 from information_schema.columns where table_name='projects' and column_name='amount_needed') THEN
    ALTER TABLE public.projects ADD COLUMN amount_needed numeric;
  END IF;
  -- currency
  IF not exists (select 1 from information_schema.columns where table_name='projects' and column_name='currency') THEN
    ALTER TABLE public.projects ADD COLUMN currency text DEFAULT 'USD';
  END IF;
  -- created_by default
  IF exists (select 1 from information_schema.columns where table_name='projects' and column_name='created_by') THEN
    ALTER TABLE public.projects ALTER COLUMN created_by SET DEFAULT auth.uid();
  ELSE
    ALTER TABLE public.projects ADD COLUMN created_by uuid DEFAULT auth.uid();
  END IF;
  -- created_at
  IF not exists (select 1 from information_schema.columns where table_name='projects' and column_name='created_at') THEN
    ALTER TABLE public.projects ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END$$;

-- New tables
create table if not exists public.project_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  url text not null,
  label text,
  created_at timestamptz default now()
);

create table if not exists public.project_partners (
  project_id uuid references public.projects(id) on delete cascade,
  organisation_id uuid references public.organisations(id) on delete cascade,
  primary key (project_id, organisation_id)
);

create table if not exists public.sdgs (
  id int primary key,
  name text not null
);
insert into public.sdgs (id, name) values
  (1, 'No Poverty'),
  (2, 'Zero Hunger'),
  (3, 'Good Health and Well-being'),
  (4, 'Quality Education'),
  (5, 'Gender Equality'),
  (6, 'Clean Water and Sanitation'),
  (7, 'Affordable and Clean Energy'),
  (8, 'Decent Work and Economic Growth'),
  (9, 'Industry, Innovation and Infrastructure'),
  (10, 'Reduced Inequalities'),
  (11, 'Sustainable Cities and Communities'),
  (12, 'Responsible Consumption and Production'),
  (13, 'Climate Action'),
  (14, 'Life Below Water'),
  (15, 'Life on Land'),
  (16, 'Peace, Justice and Strong Institutions'),
  (17, 'Partnerships for the Goals')
  on conflict do nothing;

create table if not exists public.ifrc_challenges (
  id serial primary key,
  code text unique,
  name text not null
);
insert into public.ifrc_challenges (code, name) values
  ('climate_crises', 'Climate and Crises'),
  ('health', 'Health'),
  ('migration_identity', 'Migration and Identity'),
  ('values_power_inclusion', 'Values, Power and Inclusion'),
  ('trust_digital', 'Trust and Digital')
  on conflict (code) do nothing;

create table if not exists public.project_sdgs (
  project_id uuid references public.projects(id) on delete cascade,
  sdg_id int references public.sdgs(id) on delete cascade,
  primary key (project_id, sdg_id)
);

create table if not exists public.project_ifrc_challenges (
  project_id uuid references public.projects(id) on delete cascade,
  challenge_id int references public.ifrc_challenges(id) on delete cascade,
  primary key (project_id, challenge_id)
);

create table if not exists public.project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  path text not null,
  mime_type text,
  caption text,
  created_by uuid default auth.uid(),
  created_at timestamptz default now()
);

create table if not exists public.project_posts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  title text,
  content text,
  created_by uuid default auth.uid(),
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.project_links enable row level security;
alter table public.project_partners enable row level security;
alter table public.sdgs enable row level security;
alter table public.ifrc_challenges enable row level security;
alter table public.project_sdgs enable row level security;
alter table public.project_ifrc_challenges enable row level security;
alter table public.project_media enable row level security;
alter table public.project_posts enable row level security;
alter table public.projects enable row level security;

-- helper to safely check for admin privileges across different function signatures
create or replace function public.can_admin_projects()
returns boolean
language plpgsql
stable
as $$
declare
  has_no_arg boolean := to_regproc('public.is_admin()') is not null;
  has_uid_arg boolean := to_regproc('public.is_admin(uuid)') is not null;
begin
  if has_no_arg then
    return public.is_admin();
  elsif has_uid_arg then
    return public.is_admin(auth.uid());
  else
    return false;
  end if;
end;
$$;

-- lookup table access
DROP POLICY IF EXISTS "sdgs_public_select" ON public.sdgs;
CREATE POLICY "sdgs_public_select" ON public.sdgs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "ifrc_challenges_public_select" ON public.ifrc_challenges;
CREATE POLICY "ifrc_challenges_public_select" ON public.ifrc_challenges
  FOR SELECT USING (true);

-- RLS for projects
-- drop existing policies
DROP POLICY IF EXISTS "projects_public_read_approved" ON public.projects;
DROP POLICY IF EXISTS "projects_read_admin_all" ON public.projects;
DROP POLICY IF EXISTS "projects_read_own_pending" ON public.projects;
DROP POLICY IF EXISTS "projects_update_admin_moderation" ON public.projects;
DROP POLICY IF EXISTS "projects_update_own_pending" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_auth" ON public.projects;

CREATE POLICY "projects_select" ON public.projects
  FOR SELECT USING (
    status = 'approved'
    OR auth.uid() = created_by
    OR public.can_admin_projects()
  );

CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by AND status = 'pending');

CREATE POLICY "projects_update_owner" ON public.projects
  FOR UPDATE USING (auth.uid() = created_by AND status = 'pending') WITH CHECK (auth.uid() = created_by);

CREATE POLICY "projects_update_admin" ON public.projects
  FOR UPDATE USING (public.can_admin_projects()) WITH CHECK (true);

CREATE POLICY "projects_delete_owner" ON public.projects
  FOR DELETE USING (auth.uid() = created_by AND status = 'pending');

CREATE POLICY "projects_delete_admin" ON public.projects
  FOR DELETE USING (public.can_admin_projects());

-- Helper expression for child table policies
-- project_links policies
DROP POLICY IF EXISTS "project_links_select" ON public.project_links;
CREATE POLICY "project_links_select" ON public.project_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_links.project_id
        AND (p.status = 'approved' OR auth.uid() = p.created_by OR public.can_admin_projects())
    )
  );
DROP POLICY IF EXISTS "project_links_owner_mod" ON public.project_links;
CREATE POLICY "project_links_owner_mod" ON public.project_links
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_links.project_id AND p.created_by = auth.uid() AND p.status = 'pending')
  );
CREATE POLICY "project_links_owner_update" ON public.project_links
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_links.project_id AND p.created_by = auth.uid() AND p.status = 'pending')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_links.project_id AND p.created_by = auth.uid() AND p.status = 'pending')
  );
CREATE POLICY "project_links_owner_delete" ON public.project_links
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_links.project_id AND p.created_by = auth.uid() AND p.status = 'pending')
  );
CREATE POLICY "project_links_admin_all" ON public.project_links
  FOR ALL USING (public.can_admin_projects()) WITH CHECK (true);

-- project_partners policies
DROP POLICY IF EXISTS "project_partners_select" ON public.project_partners;
CREATE POLICY "project_partners_select" ON public.project_partners
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_partners.project_id
        AND (p.status = 'approved' OR auth.uid() = p.created_by OR public.can_admin_projects())
    )
  );
DROP POLICY IF EXISTS "project_partners_owner_mod" ON public.project_partners;
CREATE POLICY "project_partners_owner_mod" ON public.project_partners
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_partners.project_id AND p.created_by = auth.uid() AND p.status = 'pending')
  );
CREATE POLICY "project_partners_owner_update" ON public.project_partners
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_partners.project_id AND p.created_by = auth.uid() AND p.status = 'pending')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_partners.project_id AND p.created_by = auth.uid() AND p.status = 'pending')
  );
CREATE POLICY "project_partners_owner_delete" ON public.project_partners
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_partners.project_id AND p.created_by = auth.uid() AND p.status = 'pending')
  );
CREATE POLICY "project_partners_admin_all" ON public.project_partners
  FOR ALL USING (public.can_admin_projects()) WITH CHECK (true);

-- project_sdgs policies
DROP POLICY IF EXISTS "project_sdgs_select" ON public.project_sdgs;
CREATE POLICY "project_sdgs_select" ON public.project_sdgs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_sdgs.project_id
        AND (p.status = 'approved' OR auth.uid() = p.created_by OR public.can_admin_projects())
    )
  );
DROP POLICY IF EXISTS "project_sdgs_owner_mod" ON public.project_sdgs;
CREATE POLICY "project_sdgs_owner_mod" ON public.project_sdgs
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_sdgs.project_id AND p.created_by = auth.uid() AND p.status = 'pending')
  );
CREATE POLICY "project_sdgs_owner_delete" ON public.project_sdgs
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_sdgs.project_id AND p.created_by = auth.uid() AND p.status = 'pending')
  );
CREATE POLICY "project_sdgs_admin_all" ON public.project_sdgs
  FOR ALL USING (public.can_admin_projects()) WITH CHECK (true);

-- project_ifrc_challenges policies
DROP POLICY IF EXISTS "project_ifrc_select" ON public.project_ifrc_challenges;
CREATE POLICY "project_ifrc_select" ON public.project_ifrc_challenges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_ifrc_challenges.project_id
        AND (p.status = 'approved' OR auth.uid() = p.created_by OR public.can_admin_projects())
    )
  );
DROP POLICY IF EXISTS "project_ifrc_owner_mod" ON public.project_ifrc_challenges;
CREATE POLICY "project_ifrc_owner_mod" ON public.project_ifrc_challenges
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_ifrc_challenges.project_id AND p.created_by = auth.uid() AND p.status = 'pending')
  );
CREATE POLICY "project_ifrc_owner_delete" ON public.project_ifrc_challenges
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_ifrc_challenges.project_id AND p.created_by = auth.uid() AND p.status = 'pending')
  );
CREATE POLICY "project_ifrc_admin_all" ON public.project_ifrc_challenges
  FOR ALL USING (public.can_admin_projects()) WITH CHECK (true);

-- project_media policies
DROP POLICY IF EXISTS "project_media_select" ON public.project_media;
CREATE POLICY "project_media_select" ON public.project_media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_media.project_id
        AND (p.status = 'approved' OR auth.uid() = p.created_by OR public.can_admin_projects())
    )
  );
DROP POLICY IF EXISTS "project_media_owner_mod" ON public.project_media;
CREATE POLICY "project_media_owner_mod" ON public.project_media
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_media.project_id AND p.created_by = auth.uid() AND p.status = 'pending')
  );
CREATE POLICY "project_media_owner_update" ON public.project_media
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_media.project_id AND p.created_by = auth.uid() AND p.status = 'pending')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_media.project_id AND p.created_by = auth.uid() AND p.status = 'pending')
  );
CREATE POLICY "project_media_owner_delete" ON public.project_media
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_media.project_id AND p.created_by = auth.uid() AND p.status = 'pending')
  );
CREATE POLICY "project_media_admin_all" ON public.project_media
  FOR ALL USING (public.can_admin_projects()) WITH CHECK (true);

-- project_posts policies
DROP POLICY IF EXISTS "project_posts_select" ON public.project_posts;
CREATE POLICY "project_posts_select" ON public.project_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_posts.project_id
        AND (p.status = 'approved' OR auth.uid() = p.created_by OR public.can_admin_projects())
    )
  );
DROP POLICY IF EXISTS "project_posts_owner_mod" ON public.project_posts;
CREATE POLICY "project_posts_owner_mod" ON public.project_posts
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_posts.project_id AND p.created_by = auth.uid() AND p.status = 'pending')
  );
CREATE POLICY "project_posts_owner_update" ON public.project_posts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_posts.project_id AND p.created_by = auth.uid() AND p.status = 'pending')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_posts.project_id AND p.created_by = auth.uid() AND p.status = 'pending')
  );
CREATE POLICY "project_posts_owner_delete" ON public.project_posts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_posts.project_id AND p.created_by = auth.uid() AND p.status = 'pending')
  );
CREATE POLICY "project_posts_admin_all" ON public.project_posts
  FOR ALL USING (public.can_admin_projects()) WITH CHECK (true);

-- transactional helper for API submission flow
create or replace function public.create_project_submission(
  p_name text,
  p_description text,
  p_lead_org_id uuid,
  p_lat double precision,
  p_lng double precision,
  p_place_name text,
  p_type_of_intervention text[],
  p_target_demographic text,
  p_lives_improved integer,
  p_start_date date,
  p_end_date date,
  p_thematic_area text[],
  p_donations_received numeric,
  p_amount_needed numeric,
  p_currency text,
  p_links jsonb,
  p_partner_org_ids uuid[],
  p_sdg_ids integer[],
  p_ifrc_ids integer[]
)
returns TABLE(id uuid, status text)
language plpgsql
set search_path = public, auth
as $$
declare
  new_project public.projects%ROWTYPE;
  link_item jsonb;
begin
  insert into public.projects (
    name,
    description,
    lead_org_id,
    lat,
    lng,
    place_name,
    type_of_intervention,
    target_demographic,
    lives_improved,
    start_date,
    end_date,
    thematic_area,
    donations_received,
    amount_needed,
    currency
  )
  values (
    p_name,
    nullif(p_description, ''),
    p_lead_org_id,
    p_lat,
    p_lng,
    p_place_name,
    coalesce(p_type_of_intervention, array[]::text[]),
    nullif(p_target_demographic, ''),
    p_lives_improved,
    p_start_date,
    p_end_date,
    coalesce(p_thematic_area, array[]::text[]),
    p_donations_received,
    p_amount_needed,
    coalesce(nullif(p_currency, ''), 'USD')
  )
  returning * into new_project;

  if p_links is not null then
    for link_item in select * from jsonb_array_elements(p_links)
    loop
      if link_item ? 'url' then
        insert into public.project_links (project_id, url, label)
        values (
          new_project.id,
          link_item->>'url',
          nullif(link_item->>'label', '')
        );
      end if;
    end loop;
  end if;

  if coalesce(array_length(p_partner_org_ids, 1), 0) > 0 then
    insert into public.project_partners (project_id, organisation_id)
    select new_project.id, unnest(p_partner_org_ids);
  end if;

  if coalesce(array_length(p_sdg_ids, 1), 0) > 0 then
    insert into public.project_sdgs (project_id, sdg_id)
    select new_project.id, unnest(p_sdg_ids);
  end if;

  if coalesce(array_length(p_ifrc_ids, 1), 0) > 0 then
    insert into public.project_ifrc_challenges (project_id, challenge_id)
    select new_project.id, unnest(p_ifrc_ids);
  end if;

  return query select new_project.id, new_project.status;
end;
$$;

grant execute on function public.create_project_submission(
  text,
  text,
  uuid,
  double precision,
  double precision,
  text,
  text[],
  text,
  integer,
  date,
  date,
  text[],
  numeric,
  numeric,
  text,
  jsonb,
  uuid[],
  integer[],
  integer[]
) to authenticated;

-- End of migration
