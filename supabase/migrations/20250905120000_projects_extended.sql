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

-- RLS for projects
-- drop existing policies
DROP POLICY IF EXISTS "projects_public_read_approved" ON public.projects;
DROP POLICY IF EXISTS "projects_read_admin_all" ON public.projects;
DROP POLICY IF EXISTS "projects_read_own_pending" ON public.projects;
DROP POLICY IF EXISTS "projects_update_admin_moderation" ON public.projects;
DROP POLICY IF EXISTS "projects_update_own_pending" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_auth" ON public.projects;

CREATE POLICY "projects_select" ON public.projects
  FOR SELECT USING (status = 'approved' OR auth.uid() = created_by OR public.is_admin());

CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by AND status = 'pending');

CREATE POLICY "projects_update_owner" ON public.projects
  FOR UPDATE USING (auth.uid() = created_by AND status = 'pending') WITH CHECK (auth.uid() = created_by);

CREATE POLICY "projects_update_admin" ON public.projects
  FOR UPDATE USING (public.is_admin()) WITH CHECK (true);

CREATE POLICY "projects_delete_owner" ON public.projects
  FOR DELETE USING (auth.uid() = created_by AND status = 'pending');

CREATE POLICY "projects_delete_admin" ON public.projects
  FOR DELETE USING (public.is_admin());

-- Helper expression for child table policies
-- project_links policies
DROP POLICY IF EXISTS "project_links_select" ON public.project_links;
CREATE POLICY "project_links_select" ON public.project_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_links.project_id
        AND (p.status = 'approved' OR auth.uid() = p.created_by OR public.is_admin())
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
  FOR ALL USING (public.is_admin()) WITH CHECK (true);

-- project_partners policies
DROP POLICY IF EXISTS "project_partners_select" ON public.project_partners;
CREATE POLICY "project_partners_select" ON public.project_partners
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_partners.project_id
        AND (p.status = 'approved' OR auth.uid() = p.created_by OR public.is_admin())
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
  FOR ALL USING (public.is_admin()) WITH CHECK (true);

-- project_sdgs policies
DROP POLICY IF EXISTS "project_sdgs_select" ON public.project_sdgs;
CREATE POLICY "project_sdgs_select" ON public.project_sdgs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_sdgs.project_id
        AND (p.status = 'approved' OR auth.uid() = p.created_by OR public.is_admin())
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
  FOR ALL USING (public.is_admin()) WITH CHECK (true);

-- project_ifrc_challenges policies
DROP POLICY IF EXISTS "project_ifrc_select" ON public.project_ifrc_challenges;
CREATE POLICY "project_ifrc_select" ON public.project_ifrc_challenges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_ifrc_challenges.project_id
        AND (p.status = 'approved' OR auth.uid() = p.created_by OR public.is_admin())
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
  FOR ALL USING (public.is_admin()) WITH CHECK (true);

-- project_media policies
DROP POLICY IF EXISTS "project_media_select" ON public.project_media;
CREATE POLICY "project_media_select" ON public.project_media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_media.project_id
        AND (p.status = 'approved' OR auth.uid() = p.created_by OR public.is_admin())
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
  FOR ALL USING (public.is_admin()) WITH CHECK (true);

-- project_posts policies
DROP POLICY IF EXISTS "project_posts_select" ON public.project_posts;
CREATE POLICY "project_posts_select" ON public.project_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_posts.project_id
        AND (p.status = 'approved' OR auth.uid() = p.created_by OR public.is_admin())
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
  FOR ALL USING (public.is_admin()) WITH CHECK (true);

-- End of migration
