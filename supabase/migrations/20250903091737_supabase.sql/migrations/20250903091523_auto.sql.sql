create extension if not exists "citext" with schema "public" version '1.6';

create type "public"."project_approval_status" as enum ('pending', 'approved', 'rejected');

drop trigger if exists "trg_enforce_status" on "public"."projects";

drop policy "profiles_public_read_admin_only" on "public"."profiles";

drop policy "profiles_self_read" on "public"."profiles";

drop policy "profiles_self_update" on "public"."profiles";

drop policy "projects_admin_full_access" on "public"."projects";

drop policy "projects_creator_insert_pending" on "public"."projects";

drop policy "projects_creator_read_own" on "public"."projects";

drop policy "projects_creator_update_pending_own" on "public"."projects";

drop policy "projects_public_read_approved_only" on "public"."projects";

drop policy "projects_insert_auth" on "public"."projects";

drop function if exists "public"."enforce_status_changes"();

drop index if exists "public"."projects_coords_idx";

drop index if exists "public"."projects_created_by_idx";

drop index if exists "public"."projects_status_idx";

create table "public"."admin_emails" (
    "email" citext not null,
    "added_by" uuid default auth.uid(),
    "added_at" timestamp with time zone default now()
);


alter table "public"."admin_emails" enable row level security;

create table "public"."app_settings" (
    "id" boolean not null default true,
    "superadmin_email" citext not null
);


alter table "public"."app_settings" enable row level security;

alter table "public"."profiles" drop column "role";

alter table "public"."projects" add column "approval_status" project_approval_status not null default 'pending'::project_approval_status;

alter table "public"."projects" add column "approved_at" timestamp with time zone;

alter table "public"."projects" add column "approved_by" uuid;

alter table "public"."projects" add column "rejected_at" timestamp with time zone;

alter table "public"."projects" add column "rejected_by" uuid;

alter table "public"."projects" add column "rejection_reason" text;

drop type "public"."project_status";

drop type "public"."user_role";

CREATE UNIQUE INDEX admin_emails_pkey ON public.admin_emails USING btree (email);

CREATE UNIQUE INDEX app_settings_pkey ON public.app_settings USING btree (id);

alter table "public"."admin_emails" add constraint "admin_emails_pkey" PRIMARY KEY using index "admin_emails_pkey";

alter table "public"."app_settings" add constraint "app_settings_pkey" PRIMARY KEY using index "app_settings_pkey";

alter table "public"."app_settings" add constraint "app_settings_id_check" CHECK (id) not valid;

alter table "public"."app_settings" validate constraint "app_settings_id_check";

alter table "public"."projects" add constraint "projects_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES auth.users(id) not valid;

alter table "public"."projects" validate constraint "projects_approved_by_fkey";

alter table "public"."projects" add constraint "projects_rejected_by_fkey" FOREIGN KEY (rejected_by) REFERENCES auth.users(id) not valid;

alter table "public"."projects" validate constraint "projects_rejected_by_fkey";

set check_function_bodies = off;

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

create or replace view "public"."rejected_projects" as  SELECT id,
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
  WHERE (approval_status = 'rejected'::project_approval_status);


CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  select public.is_superadmin()
     or exists (
       select 1
       from public.admin_emails a
       where a.email = (auth.jwt()->>'email')::citext
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

grant delete on table "public"."admin_emails" to "anon";

grant insert on table "public"."admin_emails" to "anon";

grant references on table "public"."admin_emails" to "anon";

grant select on table "public"."admin_emails" to "anon";

grant trigger on table "public"."admin_emails" to "anon";

grant truncate on table "public"."admin_emails" to "anon";

grant update on table "public"."admin_emails" to "anon";

grant delete on table "public"."admin_emails" to "authenticated";

grant insert on table "public"."admin_emails" to "authenticated";

grant references on table "public"."admin_emails" to "authenticated";

grant select on table "public"."admin_emails" to "authenticated";

grant trigger on table "public"."admin_emails" to "authenticated";

grant truncate on table "public"."admin_emails" to "authenticated";

grant update on table "public"."admin_emails" to "authenticated";

grant delete on table "public"."admin_emails" to "service_role";

grant insert on table "public"."admin_emails" to "service_role";

grant references on table "public"."admin_emails" to "service_role";

grant select on table "public"."admin_emails" to "service_role";

grant trigger on table "public"."admin_emails" to "service_role";

grant truncate on table "public"."admin_emails" to "service_role";

grant update on table "public"."admin_emails" to "service_role";

grant delete on table "public"."app_settings" to "anon";

grant insert on table "public"."app_settings" to "anon";

grant references on table "public"."app_settings" to "anon";

grant select on table "public"."app_settings" to "anon";

grant trigger on table "public"."app_settings" to "anon";

grant truncate on table "public"."app_settings" to "anon";

grant update on table "public"."app_settings" to "anon";

grant delete on table "public"."app_settings" to "authenticated";

grant insert on table "public"."app_settings" to "authenticated";

grant references on table "public"."app_settings" to "authenticated";

grant select on table "public"."app_settings" to "authenticated";

grant trigger on table "public"."app_settings" to "authenticated";

grant truncate on table "public"."app_settings" to "authenticated";

grant update on table "public"."app_settings" to "authenticated";

grant delete on table "public"."app_settings" to "service_role";

grant insert on table "public"."app_settings" to "service_role";

grant references on table "public"."app_settings" to "service_role";

grant select on table "public"."app_settings" to "service_role";

grant trigger on table "public"."app_settings" to "service_role";

grant truncate on table "public"."app_settings" to "service_role";

grant update on table "public"."app_settings" to "service_role";

create policy "admin_emails_delete_super"
on "public"."admin_emails"
as permissive
for delete
to authenticated
using (is_superadmin());


create policy "admin_emails_insert_super"
on "public"."admin_emails"
as permissive
for insert
to authenticated
with check (is_superadmin());


create policy "admin_emails_select_admins"
on "public"."admin_emails"
as permissive
for select
to authenticated
using (is_admin());


create policy "admin_emails_update_super"
on "public"."admin_emails"
as permissive
for update
to authenticated
using (is_superadmin())
with check (is_superadmin());


create policy "app_settings_insert_super"
on "public"."app_settings"
as permissive
for insert
to authenticated
with check (is_superadmin());


create policy "app_settings_select_super"
on "public"."app_settings"
as permissive
for select
to authenticated
using (is_superadmin());


create policy "app_settings_update_super"
on "public"."app_settings"
as permissive
for update
to authenticated
using (is_superadmin())
with check (is_superadmin());


create policy "projects_public_read_approved"
on "public"."projects"
as permissive
for select
to public
using ((approval_status = 'approved'::project_approval_status));


create policy "projects_read_admin_all"
on "public"."projects"
as permissive
for select
to authenticated
using (is_admin());


create policy "projects_read_own_pending"
on "public"."projects"
as permissive
for select
to authenticated
using ((created_by = auth.uid()));


create policy "projects_update_admin_moderation"
on "public"."projects"
as permissive
for update
to authenticated
using (is_admin())
with check (true);


create policy "projects_update_own_pending"
on "public"."projects"
as permissive
for update
to authenticated
using (((created_by = auth.uid()) AND (approval_status = 'pending'::project_approval_status)))
with check ((created_by = auth.uid()));


create policy "projects_insert_auth"
on "public"."projects"
as permissive
for insert
to authenticated
with check ((created_by = auth.uid()));


CREATE TRIGGER trg_prevent_last_admin_delete BEFORE DELETE ON public.admin_emails FOR EACH ROW EXECUTE FUNCTION prevent_deleting_last_admin();

CREATE TRIGGER trg_enforce_moderation_by_admin BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION enforce_moderation_by_admin();


