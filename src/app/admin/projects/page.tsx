import Link from "next/link";
import type { Database } from "@/lib/database.types";
import { getServerSupabase } from "@/lib/supabaseServer";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type ProjectListItem = Pick<
  ProjectRow,
  | "id"
  | "name"
  | "description"
  | "lat"
  | "lng"
  | "created_at"
  | "status"
  | "lead_org_id"
  | "approved_at"
  | "approved_by"
  | "rejected_at"
  | "rejected_by"
  | "rejection_reason"
> & {
  created_by_profile: Pick<ProfileRow, "full_name" | "organisation_name">[] | null;
};

type NormalizedProjectListItem = Omit<ProjectListItem, "created_by_profile"> & {
  created_by_profile: Pick<ProfileRow, "full_name" | "organisation_name"> | null;
};

function getCreatedBy(project: NormalizedProjectListItem) {
  const profile = project.created_by_profile;
  if (!profile) return null;

  return profile.full_name ?? profile.organisation_name ?? null;
}

export default async function AdminProjectsPage() {
  const supabase = await getServerSupabase();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return new Response(null, { status: 404 }) as never;

  const { data, error } = await supabase
    .from("projects")
    .select(
      "id,name,description,lat,lng,created_at,status,lead_org_id,approved_at,approved_by,rejected_at,rejected_by,rejection_reason,created_by_profile:profiles!projects_created_by_fkey(full_name,organisation_name)"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .returns<ProjectListItem[]>();

  if (error) throw error;

  const projects =
    data?.map<NormalizedProjectListItem>(project => ({
      ...project,
      created_by_profile: Array.isArray(project.created_by_profile)
        ? project.created_by_profile[0] ?? null
        : project.created_by_profile ?? null,
    })) ?? null;

  return (
    <main className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pending Projects</h1>
        <p className="text-sm text-gray-600">
          Review newly submitted projects and approve or reject them.
        </p>
      </div>
      <div className="overflow-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Created", "Name", "Location", "Excerpt", "Actions"].map(header => (
                <th key={header} className="px-4 py-2 text-left">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects?.length ? (
              projects.map(project => {
                const created = project.created_at
                  ? new Date(project.created_at).toLocaleString()
                  : "—";
                const excerpt = project.description?.slice(0, 120) ?? "";
                const location =
                  project.lat && project.lng
                    ? `${project.lat.toFixed(4)}, ${project.lng.toFixed(4)}`
                    : "—";
                const createdBy = getCreatedBy(project);

                return (
                  <tr key={project.id} className="border-t align-top">
                    <td className="px-4 py-2 whitespace-nowrap">{created}</td>
                    <td className="px-4 py-2">
                      <div className="font-medium">
                        <Link
                          href={`/admin/projects/${project.id}`}
                          className="hover:underline"
                        >
                          {project.name}
                        </Link>
                      </div>
                      <div className="text-xs text-gray-500">ID: {project.id}</div>
                      {createdBy ? (
                        <div className="text-xs text-gray-500">
                          Submitted by: {createdBy}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">{location}</td>
                    <td className="px-4 py-2">{excerpt}{project.description && project.description.length > 120 ? "…" : ""}</td>
                    <td className="px-4 py-2">
                      <form
                        action={`/api/admin/projects/${project.id}/approve`}
                        method="post"
                        className="mb-2"
                      >
                        <button className="w-full rounded border px-3 py-1 hover:bg-gray-50">
                          Approve
                        </button>
                      </form>
                      <form
                        action={`/api/admin/projects/${project.id}/reject`}
                        method="post"
                        className="flex flex-col gap-2 sm:flex-row"
                      >
                        <input
                          name="reason"
                          placeholder="Reason"
                          className="flex-1 rounded border px-2 py-1"
                          required
                        />
                        <button className="rounded border px-3 py-1 hover:bg-gray-50">
                          Reject
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                  No pending projects at the moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
