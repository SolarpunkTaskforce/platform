import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectApprovalActions } from "@/components/admin/ProjectApprovalActions";
import type { Database } from "@/lib/database.types";
import { getServerSupabase } from "@/lib/supabaseServer";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProjectMediaRow = Database["public"]["Tables"]["project_media"]["Row"];
type ProjectLinksRow = Database["public"]["Tables"]["project_links"]["Row"];

type ProjectListItem = Pick<
  ProjectRow,
  "id" | "name" | "created_at" | "created_by" | "place_name" | "links"
> & {
  project_media: Pick<ProjectMediaRow, "id">[] | null;
  project_links: Pick<ProjectLinksRow, "id">[] | null;
  created_by_profile: Pick<ProfileRow, "full_name" | "organisation_name"> | null;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch (error) {
    console.error("date-format", error);
    return value;
  }
}

function getLinksCount(project: ProjectListItem) {
  if (Array.isArray(project.project_links)) {
    return project.project_links.length;
  }
  const jsonValue = project.links;
  if (Array.isArray(jsonValue)) {
    return jsonValue.length;
  }
  return 0;
}

function getMediaCount(project: ProjectListItem) {
  if (Array.isArray(project.project_media)) {
    return project.project_media.length;
  }
  return 0;
}

function getCreatedBy(project: ProjectListItem) {
  const profile = project.created_by_profile;
  if (profile?.full_name) return profile.full_name;
  if (profile?.organisation_name) return profile.organisation_name;
  return project.created_by ?? "—";
}

export default async function AdminProjectsPage() {
  const supabase = await getServerSupabase();
  const { data: isAdmin } = await supabase.rpc("is_admin");

  if (!isAdmin) {
    notFound();
  }

  const { data, error } = await supabase
    .from("projects")
    .select(
      `id,name,created_at,created_by,place_name,links,
       project_links:project_links(id),
       project_media:project_media(id),
       created_by_profile:profiles(full_name,organisation_name)
      `
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  const projects: ProjectListItem[] = data ?? [];

  return (
    <main className="space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Project Approvals</h1>
        <p className="text-sm text-slate-500">
          Review the latest pending projects and approve or reject them.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full divide-y text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Created by</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Links</th>
              <th className="px-4 py-3">Media</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {projects.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                  No pending projects right now.
                </td>
              </tr>
            ) : (
              projects.map(project => {
                const created = formatDate(project.created_at);
                const linksCount = getLinksCount(project);
                const mediaCount = getMediaCount(project);
                return (
                  <tr key={project.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{project.name}</div>
                      <div className="text-xs text-slate-500">{project.id}</div>
                      <Link
                        href={`/admin/projects/${project.id}`}
                        className="mt-2 inline-flex text-xs font-medium text-emerald-600 hover:underline"
                      >
                        View details
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{created}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{getCreatedBy(project)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {project.place_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{linksCount}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{mediaCount}</td>
                    <td className="px-4 py-3">
                      <ProjectApprovalActions
                        projectId={project.id}
                        projectName={project.name}
                        layout="inline"
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
