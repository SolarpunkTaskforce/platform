CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA public;

CREATE TYPE "public"."project_approval_status" AS ENUM ('pending', 'approved', 'rejected');

CREATE OR REPLACE FUNCTION public.is_superadmin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(
    (auth.jwt()->>'email')::citext =
    (select superadmin_email from public.app_settings where id is true),
    false
  );
$function$
;

-- HAS_UNTRACKABLE_DEPENDENCIES: Dependencies, i.e. other functions used in the function body, of non-sql functions cannot be tracked. As a result, we cannot guarantee that function dependencies are ordered properly relative to this statement. For adds, this means you need to ensure that all functions this function depends on are created/altered before this statement.
CREATE OR REPLACE FUNCTION public.prevent_deleting_last_admin()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if (select count(*) from public.admin_emails) <= 1 then
    raise exception 'cannot delete the last admin';
  end if;
  return old;
end;
$function$
;

CREATE TABLE "public"."admin_emails" (
	"email" citext COLLATE "pg_catalog"."default" NOT NULL,
	"added_by" uuid DEFAULT auth.uid(),
	"added_at" timestamp with time zone DEFAULT now()
);

CREATE POLICY "admin_emails_delete_super" ON "public"."admin_emails"
	AS PERMISSIVE
	FOR DELETE
	TO authenticated
	USING (is_superadmin());

CREATE POLICY "admin_emails_insert_super" ON "public"."admin_emails"
	AS PERMISSIVE
	FOR INSERT
	TO authenticated
	WITH CHECK (is_superadmin());

CREATE POLICY "admin_emails_update_super" ON "public"."admin_emails"
	AS PERMISSIVE
	FOR UPDATE
	TO authenticated
	USING (is_superadmin())
	WITH CHECK (is_superadmin());

ALTER TABLE "public"."admin_emails" ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX CONCURRENTLY admin_emails_pkey ON public.admin_emails USING btree (email);

ALTER TABLE "public"."admin_emails" ADD CONSTRAINT "admin_emails_pkey" PRIMARY KEY USING INDEX "admin_emails_pkey";

CREATE TRIGGER trg_prevent_last_admin_delete BEFORE DELETE ON public.admin_emails FOR EACH ROW EXECUTE FUNCTION prevent_deleting_last_admin();

CREATE TABLE "public"."app_settings" (
	"id" boolean DEFAULT true NOT NULL,
	"superadmin_email" citext COLLATE "pg_catalog"."default" NOT NULL
);

ALTER TABLE "public"."app_settings" ADD CONSTRAINT "app_settings_id_check" CHECK(id);

CREATE POLICY "app_settings_insert_super" ON "public"."app_settings"
	AS PERMISSIVE
	FOR INSERT
	TO authenticated
	WITH CHECK (is_superadmin());

CREATE POLICY "app_settings_select_super" ON "public"."app_settings"
	AS PERMISSIVE
	FOR SELECT
	TO authenticated
	USING (is_superadmin());

CREATE POLICY "app_settings_update_super" ON "public"."app_settings"
	AS PERMISSIVE
	FOR UPDATE
	TO authenticated
	USING (is_superadmin())
	WITH CHECK (is_superadmin());

ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX CONCURRENTLY app_settings_pkey ON public.app_settings USING btree (id);

ALTER TABLE "public"."app_settings" ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY USING INDEX "app_settings_pkey";

CREATE TABLE "public"."organisation_members" (
	"organisation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text COLLATE "pg_catalog"."default" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);

ALTER TABLE "public"."organisation_members" ADD CONSTRAINT "organisation_members_role_check" CHECK((role = ANY (ARRAY['owner'::text, 'admin'::text, 'member'::text])));

CREATE POLICY "org_members_insert_self_owner" ON "public"."organisation_members"
	AS PERMISSIVE
	FOR INSERT
	TO authenticated
	WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "org_members_read" ON "public"."organisation_members"
	AS PERMISSIVE
	FOR SELECT
	TO PUBLIC
	USING ((EXISTS ( SELECT 1
   FROM organisation_members m2
  WHERE ((m2.organisation_id = organisation_members.organisation_id) AND (m2.user_id = auth.uid())))));

CREATE POLICY "org_members_update_admins" ON "public"."organisation_members"
	AS PERMISSIVE
	FOR UPDATE
	TO PUBLIC
	USING ((EXISTS ( SELECT 1
   FROM organisation_members m3
  WHERE ((m3.organisation_id = organisation_members.organisation_id) AND (m3.user_id = auth.uid()) AND (m3.role = ANY (ARRAY['owner'::text, 'admin'::text]))))))
	WITH CHECK ((EXISTS ( SELECT 1
   FROM organisation_members m4
  WHERE ((m4.organisation_id = organisation_members.organisation_id) AND (m4.user_id = auth.uid()) AND (m4.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));

ALTER TABLE "public"."organisation_members" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."organisation_members" ADD CONSTRAINT "organisation_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;

ALTER TABLE "public"."organisation_members" VALIDATE CONSTRAINT "organisation_members_user_id_fkey";

CREATE UNIQUE INDEX CONCURRENTLY organisation_members_pkey ON public.organisation_members USING btree (organisation_id, user_id);

ALTER TABLE "public"."organisation_members" ADD CONSTRAINT "organisation_members_pkey" PRIMARY KEY USING INDEX "organisation_members_pkey";

CREATE TABLE "public"."organisations" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text COLLATE "pg_catalog"."default" NOT NULL,
	"description" text COLLATE "pg_catalog"."default",
	"website" text COLLATE "pg_catalog"."default",
	"country" text COLLATE "pg_catalog"."default",
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);

CREATE POLICY "orgs_authenticated_insert" ON "public"."organisations"
	AS PERMISSIVE
	FOR INSERT
	TO authenticated
	WITH CHECK (true);

CREATE POLICY "orgs_members_update" ON "public"."organisations"
	AS PERMISSIVE
	FOR UPDATE
	TO PUBLIC
	USING ((EXISTS ( SELECT 1
   FROM organisation_members m
  WHERE ((m.organisation_id = organisations.id) AND (m.user_id = auth.uid()) AND (m.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));

CREATE POLICY "orgs_public_read" ON "public"."organisations"
	AS PERMISSIVE
	FOR SELECT
	TO PUBLIC
	USING (true);

ALTER TABLE "public"."organisations" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."organisations" ADD CONSTRAINT "organisations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL NOT VALID;

ALTER TABLE "public"."organisations" VALIDATE CONSTRAINT "organisations_created_by_fkey";

CREATE UNIQUE INDEX CONCURRENTLY organisations_pkey ON public.organisations USING btree (id);

ALTER TABLE "public"."organisations" ADD CONSTRAINT "organisations_pkey" PRIMARY KEY USING INDEX "organisations_pkey";

ALTER TABLE "public"."organisation_members" ADD CONSTRAINT "organisation_members_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE NOT VALID;

ALTER TABLE "public"."organisation_members" VALIDATE CONSTRAINT "organisation_members_organisation_id_fkey";

CREATE TABLE "public"."profiles" (
	"id" uuid NOT NULL,
	"kind" text COLLATE "pg_catalog"."default" DEFAULT 'individual'::text NOT NULL,
	"full_name" text COLLATE "pg_catalog"."default",
	"surname" text COLLATE "pg_catalog"."default",
	"nationality" text COLLATE "pg_catalog"."default",
	"organisation_name" text COLLATE "pg_catalog"."default",
	"organisation_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"is_admin" boolean DEFAULT false,
	"role" text COLLATE "pg_catalog"."default" DEFAULT 'user'::text NOT NULL
);

ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_kind_check" CHECK((kind = ANY (ARRAY['individual'::text, 'organisation'::text])));

CREATE POLICY "profiles_public_read" ON "public"."profiles"
	AS PERMISSIVE
	FOR SELECT
	TO PUBLIC
	USING (true);

CREATE POLICY "profiles_user_update_self" ON "public"."profiles"
	AS PERMISSIVE
	FOR UPDATE
	TO PUBLIC
	USING ((auth.uid() = id))
	WITH CHECK ((auth.uid() = id));

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;

ALTER TABLE "public"."profiles" VALIDATE CONSTRAINT "profiles_id_fkey";

ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE SET NULL NOT VALID;

ALTER TABLE "public"."profiles" VALIDATE CONSTRAINT "profiles_organisation_id_fkey";

CREATE UNIQUE INDEX CONCURRENTLY profiles_pkey ON public.profiles USING btree (id);

ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_pkey" PRIMARY KEY USING INDEX "profiles_pkey";

-- HAS_UNTRACKABLE_DEPENDENCIES: Dependencies, i.e. other functions used in the function body, of non-sql functions cannot be tracked. As a result, we cannot guarantee that function dependencies are ordered properly relative to this statement. For adds, this means you need to ensure that all functions this function depends on are created/altered before this statement.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'auth'
AS $function$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  select coalesce((select is_admin from public.profiles p where p.id = uid), false)
$function$
;

-- HAS_UNTRACKABLE_DEPENDENCIES: Dependencies, i.e. other functions used in the function body, of non-sql functions cannot be tracked. As a result, we cannot guarantee that function dependencies are ordered properly relative to this statement. For adds, this means you need to ensure that all functions this function depends on are created/altered before this statement.
CREATE OR REPLACE FUNCTION public.enforce_moderation_by_admin()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- Only admins may change moderation-related fields
  if (new.approval_status is distinct from old.approval_status)
     or (new.approved_at is distinct from old.approved_at)
     or (new.approved_by is distinct from old.approved_by)
     or (new.rejected_at is distinct from old.rejected_at)
     or (new.rejected_by is distinct from old.rejected_by)
     or (new.rejection_reason is distinct from old.rejection_reason)
  then
    if not public.is_admin() then
      raise exception 'Only admins can modify moderation fields';
    end if;

    -- Stamp transitions
    if new.approval_status = 'approved' and old.approval_status <> 'approved' then
      new.approved_at := now();
      new.approved_by := auth.uid();
      new.rejected_at := null;
      new.rejected_by := null;
      new.rejection_reason := null;
    elsif new.approval_status = 'rejected' and old.approval_status <> 'rejected' then
      new.rejected_at := now();
      new.rejected_by := auth.uid();
      new.approved_at := null;
      new.approved_by := null;
      -- rejection_reason can be set by admin via update payload
    end if;
  end if;

  -- Non-admins cannot change approval_status at all
  if not public.is_admin() and (new.approval_status is distinct from old.approval_status) then
    raise exception 'Only admins can change approval_status';
  end if;

  return new;
end;
$function$
;

CREATE POLICY "admin_emails_select_admins" ON "public"."admin_emails"
        AS PERMISSIVE
        FOR SELECT
        TO authenticated
        USING (is_admin());

CREATE TABLE "public"."projects" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"title" text COLLATE "pg_catalog"."default" NOT NULL,
	"description" text COLLATE "pg_catalog"."default",
	"links" jsonb,
	"lead_org_id" uuid,
	"partner_org_ids" uuid[],
	"country" text COLLATE "pg_catalog"."default",
	"region" text COLLATE "pg_catalog"."default",
	"lat" double precision,
	"lng" double precision,
	"intervention_type" text COLLATE "pg_catalog"."default",
	"target_demographics" text[] COLLATE "pg_catalog"."default",
	"lives_improved" integer,
	"start_date" date,
	"end_date" date,
	"thematic_area" text COLLATE "pg_catalog"."default",
	"sdgs" text[] COLLATE "pg_catalog"."default",
	"ifrc_global_challenges" text[] COLLATE "pg_catalog"."default",
	"donations_received" numeric DEFAULT 0,
	"funding_needed" numeric,
	"status" text COLLATE "pg_catalog"."default" DEFAULT 'planned'::text NOT NULL,
	"review_status" text COLLATE "pg_catalog"."default" DEFAULT 'pending'::text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"approval_status" project_approval_status DEFAULT 'pending'::project_approval_status NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by" uuid,
	"rejected_at" timestamp with time zone,
	"rejected_by" uuid,
	"rejection_reason" text COLLATE "pg_catalog"."default"
);

ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_review_status_check" CHECK((review_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])));

ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_status_check" CHECK((status = ANY (ARRAY['planned'::text, 'active'::text, 'completed'::text])));

CREATE POLICY "projects_admin_update" ON "public"."projects"
	AS PERMISSIVE
	FOR UPDATE
	TO PUBLIC
	USING (is_admin(auth.uid()))
	WITH CHECK (true);

CREATE POLICY "projects_insert_auth" ON "public"."projects"
	AS PERMISSIVE
	FOR INSERT
	TO authenticated
	WITH CHECK ((created_by = auth.uid()));

CREATE POLICY "projects_public_read_approved" ON "public"."projects"
	AS PERMISSIVE
	FOR SELECT
	TO PUBLIC
	USING ((approval_status = 'approved'::project_approval_status));

CREATE POLICY "projects_public_read_approved_or_owner" ON "public"."projects"
	AS PERMISSIVE
	FOR SELECT
	TO PUBLIC
	USING (((review_status = 'approved'::text) OR (auth.uid() = created_by)));

CREATE POLICY "projects_read_admin_all" ON "public"."projects"
	AS PERMISSIVE
	FOR SELECT
	TO authenticated
	USING (is_admin());

CREATE POLICY "projects_read_own_pending" ON "public"."projects"
	AS PERMISSIVE
	FOR SELECT
	TO authenticated
	USING ((created_by = auth.uid()));

CREATE POLICY "projects_update_admin_moderation" ON "public"."projects"
	AS PERMISSIVE
	FOR UPDATE
	TO authenticated
	USING (is_admin())
	WITH CHECK (true);

CREATE POLICY "projects_update_own_pending" ON "public"."projects"
	AS PERMISSIVE
	FOR UPDATE
	TO authenticated
	USING (((created_by = auth.uid()) AND (approval_status = 'pending'::project_approval_status)))
	WITH CHECK ((created_by = auth.uid()));

CREATE POLICY "projects_update_owner_while_pending" ON "public"."projects"
	AS PERMISSIVE
	FOR UPDATE
	TO PUBLIC
	USING (((auth.uid() = created_by) AND (review_status = 'pending'::text)))
	WITH CHECK ((auth.uid() = created_by));

ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES auth.users(id) NOT VALID;

ALTER TABLE "public"."projects" VALIDATE CONSTRAINT "projects_approved_by_fkey";

ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL NOT VALID;

ALTER TABLE "public"."projects" VALIDATE CONSTRAINT "projects_created_by_fkey";

ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_lead_org_id_fkey" FOREIGN KEY (lead_org_id) REFERENCES organisations(id) ON DELETE SET NULL NOT VALID;

ALTER TABLE "public"."projects" VALIDATE CONSTRAINT "projects_lead_org_id_fkey";

ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_rejected_by_fkey" FOREIGN KEY (rejected_by) REFERENCES auth.users(id) NOT VALID;

ALTER TABLE "public"."projects" VALIDATE CONSTRAINT "projects_rejected_by_fkey";

CREATE UNIQUE INDEX CONCURRENTLY projects_pkey ON public.projects USING btree (id);

ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_pkey" PRIMARY KEY USING INDEX "projects_pkey";

CREATE TRIGGER trg_enforce_moderation_by_admin BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION enforce_moderation_by_admin();

CREATE TABLE "public"."watchdog_cases" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"title" text COLLATE "pg_catalog"."default" NOT NULL,
	"description" text COLLATE "pg_catalog"."default",
	"location" text COLLATE "pg_catalog"."default",
	"country" text COLLATE "pg_catalog"."default",
	"region" text COLLATE "pg_catalog"."default",
	"lat" double precision,
	"lng" double precision,
	"target_demographics" text[] COLLATE "pg_catalog"."default",
	"links" jsonb,
	"sdgs" text[] COLLATE "pg_catalog"."default",
	"ifrc_global_challenges" text[] COLLATE "pg_catalog"."default",
	"review_status" text COLLATE "pg_catalog"."default" DEFAULT 'pending'::text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);

ALTER TABLE "public"."watchdog_cases" ADD CONSTRAINT "watchdog_cases_review_status_check" CHECK((review_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])));

CREATE POLICY "wd_admin_update" ON "public"."watchdog_cases"
	AS PERMISSIVE
	FOR UPDATE
	TO PUBLIC
	USING (is_admin(auth.uid()))
	WITH CHECK (true);

CREATE POLICY "wd_insert_auth" ON "public"."watchdog_cases"
	AS PERMISSIVE
	FOR INSERT
	TO authenticated
	WITH CHECK ((auth.uid() = created_by));

CREATE POLICY "wd_public_read_approved_or_owner" ON "public"."watchdog_cases"
	AS PERMISSIVE
	FOR SELECT
	TO PUBLIC
	USING (((review_status = 'approved'::text) OR (auth.uid() = created_by)));

CREATE POLICY "wd_update_owner_while_pending" ON "public"."watchdog_cases"
	AS PERMISSIVE
	FOR UPDATE
	TO PUBLIC
	USING (((auth.uid() = created_by) AND (review_status = 'pending'::text)))
	WITH CHECK ((auth.uid() = created_by));

ALTER TABLE "public"."watchdog_cases" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."watchdog_cases" ADD CONSTRAINT "watchdog_cases_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL NOT VALID;

ALTER TABLE "public"."watchdog_cases" VALIDATE CONSTRAINT "watchdog_cases_created_by_fkey";

CREATE UNIQUE INDEX CONCURRENTLY watchdog_cases_pkey ON public.watchdog_cases USING btree (id);

ALTER TABLE "public"."watchdog_cases" ADD CONSTRAINT "watchdog_cases_pkey" PRIMARY KEY USING INDEX "watchdog_cases_pkey";

CREATE VIEW "public"."rejected_projects" AS
 SELECT id,
    title,
    description,
    links,
    lead_org_id,
    partner_org_ids,
    country,
    region,
    lat,
    lng,
    intervention_type,
    target_demographics,
    lives_improved,
    start_date,
    end_date,
    thematic_area,
    sdgs,
    ifrc_global_challenges,
    donations_received,
    funding_needed,
    status,
    review_status,
    created_by,
    created_at,
    approval_status,
    approved_at,
    approved_by,
    rejected_at,
    rejected_by,
    rejection_reason
   FROM projects
  WHERE approval_status = 'rejected'::project_approval_status;;

