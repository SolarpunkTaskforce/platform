create extension if not exists "citext" with schema "public" version '1.6';

create type "public"."project_approval_status" as enum ('pending', 'approved', 'rejected');

drop trigger if exists "trg_enforce_status" on "public"."projects";

drop policy "profiles_public_read_admin_only" on "public"."profiles";

drop policy "profiles_self_read" on "public"."profiles";

drop policy "profiles_self_update" on "public"."profiles";

drop policy "project_ifrc_admin_all" on "public"."project_ifrc_challenges";

drop policy "project_ifrc_owner_delete" on "public"."project_ifrc_challenges";

drop policy "project_ifrc_owner_mod" on "public"."project_ifrc_challenges";

drop policy "project_ifrc_select" on "public"."project_ifrc_challenges";

drop policy "project_links_admin_all" on "public"."project_links";

drop policy "project_links_owner_delete" on "public"."project_links";

drop policy "project_links_owner_mod" on "public"."project_links";

drop policy "project_links_owner_update" on "public"."project_links";

drop policy "project_links_select" on "public"."project_links";

drop policy "project_media_admin_all" on "public"."project_media";

drop policy "project_media_owner_delete" on "public"."project_media";

drop policy "project_media_owner_mod" on "public"."project_media";

drop policy "project_media_owner_update" on "public"."project_media";

drop policy "project_media_select" on "public"."project_media";

drop policy "project_partners_admin_all" on "public"."project_partners";

drop policy "project_partners_owner_delete" on "public"."project_partners";

drop policy "project_partners_owner_mod" on "public"."project_partners";

drop policy "project_partners_owner_update" on "public"."project_partners";

drop policy "project_partners_select" on "public"."project_partners";

drop policy "project_posts_admin_all" on "public"."project_posts";

drop policy "project_posts_owner_delete" on "public"."project_posts";

drop policy "project_posts_owner_mod" on "public"."project_posts";

drop policy "project_posts_owner_update" on "public"."project_posts";

drop policy "project_posts_select" on "public"."project_posts";

drop policy "project_sdgs_admin_all" on "public"."project_sdgs";

drop policy "project_sdgs_owner_delete" on "public"."project_sdgs";

drop policy "project_sdgs_owner_mod" on "public"."project_sdgs";

drop policy "project_sdgs_select" on "public"."project_sdgs";

drop policy "projects_admin_full_access" on "public"."projects";

drop policy "projects_creator_insert_pending" on "public"."projects";

drop policy "projects_creator_read_own" on "public"."projects";

drop policy "projects_creator_update_pending_own" on "public"."projects";

drop policy "projects_delete_admin" on "public"."projects";

drop policy "projects_delete_owner" on "public"."projects";

drop policy "projects_insert" on "public"."projects";

drop policy "projects_public_read_approved_only" on "public"."projects";

drop policy "projects_select" on "public"."projects";

drop policy "projects_update_admin" on "public"."projects";

drop policy "projects_update_owner" on "public"."projects";

revoke delete on table "public"."ifrc_challenges" from "anon";

revoke insert on table "public"."ifrc_challenges" from "anon";

revoke references on table "public"."ifrc_challenges" from "anon";

revoke select on table "public"."ifrc_challenges" from "anon";

revoke trigger on table "public"."ifrc_challenges" from "anon";

revoke truncate on table "public"."ifrc_challenges" from "anon";

revoke update on table "public"."ifrc_challenges" from "anon";

revoke delete on table "public"."ifrc_challenges" from "authenticated";

revoke insert on table "public"."ifrc_challenges" from "authenticated";

revoke references on table "public"."ifrc_challenges" from "authenticated";

revoke select on table "public"."ifrc_challenges" from "authenticated";

revoke trigger on table "public"."ifrc_challenges" from "authenticated";

revoke truncate on table "public"."ifrc_challenges" from "authenticated";

revoke update on table "public"."ifrc_challenges" from "authenticated";

revoke delete on table "public"."ifrc_challenges" from "service_role";

revoke insert on table "public"."ifrc_challenges" from "service_role";

revoke references on table "public"."ifrc_challenges" from "service_role";

revoke select on table "public"."ifrc_challenges" from "service_role";

revoke trigger on table "public"."ifrc_challenges" from "service_role";

revoke truncate on table "public"."ifrc_challenges" from "service_role";

revoke update on table "public"."ifrc_challenges" from "service_role";

revoke delete on table "public"."project_ifrc_challenges" from "anon";

revoke insert on table "public"."project_ifrc_challenges" from "anon";

revoke references on table "public"."project_ifrc_challenges" from "anon";

revoke select on table "public"."project_ifrc_challenges" from "anon";

revoke trigger on table "public"."project_ifrc_challenges" from "anon";

revoke truncate on table "public"."project_ifrc_challenges" from "anon";

revoke update on table "public"."project_ifrc_challenges" from "anon";

revoke delete on table "public"."project_ifrc_challenges" from "authenticated";

revoke insert on table "public"."project_ifrc_challenges" from "authenticated";

revoke references on table "public"."project_ifrc_challenges" from "authenticated";

revoke select on table "public"."project_ifrc_challenges" from "authenticated";

revoke trigger on table "public"."project_ifrc_challenges" from "authenticated";

revoke truncate on table "public"."project_ifrc_challenges" from "authenticated";

revoke update on table "public"."project_ifrc_challenges" from "authenticated";

revoke delete on table "public"."project_ifrc_challenges" from "service_role";

revoke insert on table "public"."project_ifrc_challenges" from "service_role";

revoke references on table "public"."project_ifrc_challenges" from "service_role";

revoke select on table "public"."project_ifrc_challenges" from "service_role";

revoke trigger on table "public"."project_ifrc_challenges" from "service_role";

revoke truncate on table "public"."project_ifrc_challenges" from "service_role";

revoke update on table "public"."project_ifrc_challenges" from "service_role";

revoke delete on table "public"."project_links" from "anon";

revoke insert on table "public"."project_links" from "anon";

revoke references on table "public"."project_links" from "anon";

revoke select on table "public"."project_links" from "anon";

revoke trigger on table "public"."project_links" from "anon";

revoke truncate on table "public"."project_links" from "anon";

revoke update on table "public"."project_links" from "anon";

revoke delete on table "public"."project_links" from "authenticated";

revoke insert on table "public"."project_links" from "authenticated";

revoke references on table "public"."project_links" from "authenticated";

revoke select on table "public"."project_links" from "authenticated";

revoke trigger on table "public"."project_links" from "authenticated";

revoke truncate on table "public"."project_links" from "authenticated";

revoke update on table "public"."project_links" from "authenticated";

revoke delete on table "public"."project_links" from "service_role";

revoke insert on table "public"."project_links" from "service_role";

revoke references on table "public"."project_links" from "service_role";

revoke select on table "public"."project_links" from "service_role";

revoke trigger on table "public"."project_links" from "service_role";

revoke truncate on table "public"."project_links" from "service_role";

revoke update on table "public"."project_links" from "service_role";

revoke delete on table "public"."project_media" from "anon";

revoke insert on table "public"."project_media" from "anon";

revoke references on table "public"."project_media" from "anon";

revoke select on table "public"."project_media" from "anon";

revoke trigger on table "public"."project_media" from "anon";

revoke truncate on table "public"."project_media" from "anon";

revoke update on table "public"."project_media" from "anon";

revoke delete on table "public"."project_media" from "authenticated";

revoke insert on table "public"."project_media" from "authenticated";

revoke references on table "public"."project_media" from "authenticated";

revoke select on table "public"."project_media" from "authenticated";

revoke trigger on table "public"."project_media" from "authenticated";

revoke truncate on table "public"."project_media" from "authenticated";

revoke update on table "public"."project_media" from "authenticated";

revoke delete on table "public"."project_media" from "service_role";

revoke insert on table "public"."project_media" from "service_role";

revoke references on table "public"."project_media" from "service_role";

revoke select on table "public"."project_media" from "service_role";

revoke trigger on table "public"."project_media" from "service_role";

revoke truncate on table "public"."project_media" from "service_role";

revoke update on table "public"."project_media" from "service_role";

revoke delete on table "public"."project_partners" from "anon";

revoke insert on table "public"."project_partners" from "anon";

revoke references on table "public"."project_partners" from "anon";

revoke select on table "public"."project_partners" from "anon";

revoke trigger on table "public"."project_partners" from "anon";

revoke truncate on table "public"."project_partners" from "anon";

revoke update on table "public"."project_partners" from "anon";

revoke delete on table "public"."project_partners" from "authenticated";

revoke insert on table "public"."project_partners" from "authenticated";

revoke references on table "public"."project_partners" from "authenticated";

revoke select on table "public"."project_partners" from "authenticated";

revoke trigger on table "public"."project_partners" from "authenticated";

revoke truncate on table "public"."project_partners" from "authenticated";

revoke update on table "public"."project_partners" from "authenticated";

revoke delete on table "public"."project_partners" from "service_role";

revoke insert on table "public"."project_partners" from "service_role";

revoke references on table "public"."project_partners" from "service_role";

revoke select on table "public"."project_partners" from "service_role";

revoke trigger on table "public"."project_partners" from "service_role";

revoke truncate on table "public"."project_partners" from "service_role";

revoke update on table "public"."project_partners" from "service_role";

revoke delete on table "public"."project_posts" from "anon";

revoke insert on table "public"."project_posts" from "anon";

revoke references on table "public"."project_posts" from "anon";

revoke select on table "public"."project_posts" from "anon";

revoke trigger on table "public"."project_posts" from "anon";

revoke truncate on table "public"."project_posts" from "anon";

revoke update on table "public"."project_posts" from "anon";

revoke delete on table "public"."project_posts" from "authenticated";

revoke insert on table "public"."project_posts" from "authenticated";

revoke references on table "public"."project_posts" from "authenticated";

revoke select on table "public"."project_posts" from "authenticated";

revoke trigger on table "public"."project_posts" from "authenticated";

revoke truncate on table "public"."project_posts" from "authenticated";

revoke update on table "public"."project_posts" from "authenticated";

revoke delete on table "public"."project_posts" from "service_role";

revoke insert on table "public"."project_posts" from "service_role";

revoke references on table "public"."project_posts" from "service_role";

revoke select on table "public"."project_posts" from "service_role";

revoke trigger on table "public"."project_posts" from "service_role";

revoke truncate on table "public"."project_posts" from "service_role";

revoke update on table "public"."project_posts" from "service_role";

revoke delete on table "public"."project_sdgs" from "anon";

revoke insert on table "public"."project_sdgs" from "anon";

revoke references on table "public"."project_sdgs" from "anon";

revoke select on table "public"."project_sdgs" from "anon";

revoke trigger on table "public"."project_sdgs" from "anon";

revoke truncate on table "public"."project_sdgs" from "anon";

revoke update on table "public"."project_sdgs" from "anon";

revoke delete on table "public"."project_sdgs" from "authenticated";

revoke insert on table "public"."project_sdgs" from "authenticated";

revoke references on table "public"."project_sdgs" from "authenticated";

revoke select on table "public"."project_sdgs" from "authenticated";

revoke trigger on table "public"."project_sdgs" from "authenticated";

revoke truncate on table "public"."project_sdgs" from "authenticated";

revoke update on table "public"."project_sdgs" from "authenticated";

revoke delete on table "public"."project_sdgs" from "service_role";

revoke insert on table "public"."project_sdgs" from "service_role";

revoke references on table "public"."project_sdgs" from "service_role";

revoke select on table "public"."project_sdgs" from "service_role";

revoke trigger on table "public"."project_sdgs" from "service_role";

revoke truncate on table "public"."project_sdgs" from "service_role";

revoke update on table "public"."project_sdgs" from "service_role";

revoke delete on table "public"."sdgs" from "anon";

revoke insert on table "public"."sdgs" from "anon";

revoke references on table "public"."sdgs" from "anon";

revoke select on table "public"."sdgs" from "anon";

revoke trigger on table "public"."sdgs" from "anon";

revoke truncate on table "public"."sdgs" from "anon";

revoke update on table "public"."sdgs" from "anon";

revoke delete on table "public"."sdgs" from "authenticated";

revoke insert on table "public"."sdgs" from "authenticated";

revoke references on table "public"."sdgs" from "authenticated";

revoke select on table "public"."sdgs" from "authenticated";

revoke trigger on table "public"."sdgs" from "authenticated";

revoke truncate on table "public"."sdgs" from "authenticated";

revoke update on table "public"."sdgs" from "authenticated";

revoke delete on table "public"."sdgs" from "service_role";

revoke insert on table "public"."sdgs" from "service_role";

revoke references on table "public"."sdgs" from "service_role";

revoke select on table "public"."sdgs" from "service_role";

revoke trigger on table "public"."sdgs" from "service_role";

revoke truncate on table "public"."sdgs" from "service_role";

revoke update on table "public"."sdgs" from "service_role";

alter table "public"."ifrc_challenges" drop constraint "ifrc_challenges_code_key";

alter table "public"."project_ifrc_challenges" drop constraint "project_ifrc_challenges_challenge_id_fkey";

alter table "public"."project_ifrc_challenges" drop constraint "project_ifrc_challenges_project_id_fkey";

alter table "public"."project_links" drop constraint "project_links_project_id_fkey";

alter table "public"."project_media" drop constraint "project_media_project_id_fkey";

alter table "public"."project_partners" drop constraint "project_partners_organisation_id_fkey";

alter table "public"."project_partners" drop constraint "project_partners_project_id_fkey";

alter table "public"."project_posts" drop constraint "project_posts_project_id_fkey";

alter table "public"."project_sdgs" drop constraint "project_sdgs_project_id_fkey";

alter table "public"."project_sdgs" drop constraint "project_sdgs_sdg_id_fkey";

drop function if exists "public"."enforce_status_changes"();

alter table "public"."ifrc_challenges" drop constraint "ifrc_challenges_pkey";

alter table "public"."project_ifrc_challenges" drop constraint "project_ifrc_challenges_pkey";

alter table "public"."project_links" drop constraint "project_links_pkey";

alter table "public"."project_media" drop constraint "project_media_pkey";

alter table "public"."project_partners" drop constraint "project_partners_pkey";

alter table "public"."project_posts" drop constraint "project_posts_pkey";

alter table "public"."project_sdgs" drop constraint "project_sdgs_pkey";

alter table "public"."sdgs" drop constraint "sdgs_pkey";

drop index if exists "public"."ifrc_challenges_code_key";

drop index if exists "public"."ifrc_challenges_pkey";

drop index if exists "public"."project_ifrc_challenges_pkey";

drop index if exists "public"."project_links_pkey";

drop index if exists "public"."project_media_pkey";

drop index if exists "public"."project_partners_pkey";

drop index if exists "public"."project_posts_pkey";

drop index if exists "public"."project_sdgs_pkey";

drop index if exists "public"."projects_coords_idx";

drop index if exists "public"."projects_created_by_idx";

drop index if exists "public"."projects_status_idx";

drop index if exists "public"."sdgs_pkey";

drop table "public"."ifrc_challenges";

drop table "public"."project_ifrc_challenges";

drop table "public"."project_links";

drop table "public"."project_media";

drop table "public"."project_partners";

drop table "public"."project_posts";

drop table "public"."project_sdgs";

drop table "public"."sdgs";

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

alter table "public"."projects" drop column "amount_needed";

alter table "public"."projects" drop column "currency";

alter table "public"."projects" drop column "name";

alter table "public"."projects" drop column "place_name";

alter table "public"."projects" drop column "target_demographic";

alter table "public"."projects" drop column "type_of_intervention";

alter table "public"."projects" add column "approval_status" project_approval_status not null default 'pending'::project_approval_status;

alter table "public"."projects" add column "approved_at" timestamp with time zone;

alter table "public"."projects" add column "approved_by" uuid;

alter table "public"."projects" add column "funding_needed" numeric;

alter table "public"."projects" add column "rejected_at" timestamp with time zone;

alter table "public"."projects" add column "rejected_by" uuid;

alter table "public"."projects" add column "rejection_reason" text;

alter table "public"."projects" add column "title" text not null;

alter table "public"."projects" alter column "created_by" drop default;

alter table "public"."projects" alter column "thematic_area" set data type text using "thematic_area"::text;

drop sequence if exists "public"."ifrc_challenges_id_seq";

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


create policy "projects_insert_auth"
on "public"."projects"
as permissive
for insert
to authenticated
with check ((created_by = auth.uid()));


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


CREATE TRIGGER trg_prevent_last_admin_delete BEFORE DELETE ON public.admin_emails FOR EACH ROW EXECUTE FUNCTION prevent_deleting_last_admin();

CREATE TRIGGER trg_enforce_moderation_by_admin BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION enforce_moderation_by_admin();


