import Link from "next/link";

import clsx from "clsx";

import { DeleteProjectButton } from "@/components/admin/DeleteProjectButton";
import { getServerSupabase } from "@/lib/supabaseServer";

type ProjectStatus = "pending" | "approved" | "rejected";
type ProjectCategory = "humanitarian" | "environmental";

type SearchParams = Record<string, string | string[] | undefined>;

// NOTE: We keep the row type loose here because database.types.ts may lag behind
// migrations (e.g. slug). We still rely on RLS + admin gating for access.
type ProjectRow = {
  id: string;
  slug?: string | null;
  name?: string | null;
  description?: string | null;
  lat?: number | null;
  lng?: number | null;
  place_name?: string | null;
  lead_org_id?: string | null;
  lead_org?: { name?: string | null }[] | null;
  status?: ProjectStatus | string | null;
  created_at?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  rejected_at?: string | null;
  rejected_by?: string | null;
  rejection_reason?: string | null;
  category?: ProjectCategory | string | null;
};

const VIEWS: { id: ProjectStatus; label: string; description: string }[] = [
  {
    id: "pending",
    label: "Pending",
    description: "Projects awaiting review. Approving will publish them on the map.",
  },
  {
    id: "approved",
    label: "Approved",
    description: "Approved projects are public and show on the map.",
  },
  {
    id: "rejected",
    label: "Rejected",
    description: "Rejected projects are hidden from the map but remain in the archive.",
  },
];

const CATEGORIES: { id: ProjectCategory; label: string }[] = [
  { id: "environmental", label: "Environmental" },
  { id: "humanitarian", label: "Humanitarian" },
];

export default async function AdminRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await getServerSupabase();
  const resolvedSearchParams = await searchParams;

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    // keep behavior consistent: if not admin, do not show this page
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold">Not found</h1>
      </main>
    );
  }

  const currentCategoryParam = Array.isArray(resolvedSearchParams?.category)
    ? resolvedSearchParams?.category[0]
    : resolvedSearchParams?.category;

  const currentCategory: ProjectCategory =
    currentCategoryParam === "humanitarian" || currentCategoryParam === "environmental"
      ? currentCategoryParam
      : "environmental";

  const { data: projects, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      slug,
      name,
      description,
      lat,
      lng,
      place_name,
      lead_org_id,
      lead_org:organisations!projects_lead_org_id_fkey(name),
      status,
      created_at,
      approved_at,
      approved_by,
      rejected_at,
      rejected_by,
      rejection_reason,
      category
      `,
    )
    .eq("category", currentCategory)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const grouped: Record<ProjectStatus, ProjectRow[]> = {
    pending: [],
    approved: [],
    rejected: [],
  };

  for (const raw of (projects ?? []) as unknown as ProjectRow[]) {
    const status = (raw.status as ProjectStatus | null) ?? "pending";
    if (status in grouped) grouped[status].push(raw);
    else grouped.pending.push(raw);
  }

  const currentViewParam = Array.isArray(resolvedSearchParams?.view)
    ? resolvedSearchParams?.view[0]
    : resolvedSearchParams?.view;

  const currentView: ProjectStatus =
    currentViewParam === "approved" || currentViewParam === "rejected" ? currentViewParam : "pending";

  const messageParam = Array.isArray(resolvedSearchParams?.message)
    ? resolvedSearchParams?.message[0]
    : resolvedSearchParams?.message;

  const errorParam = Array.isArray(resolvedSearchParams?.error)
    ? resolvedSearchParams?.error[0]
    : resolvedSearchParams?.error;

  const rows = grouped[currentView] ?? [];

  // Base columns: Name, Organisation, Location, Submitted, Manage
  // + Pending: Actions (1)
  // + Approved: Approved On, Approved By (2)
  // + Rejected: Rejected On, Rejected By, Reason (3)
  const baseColumnCount = 5;
  const columnCount =
    currentView === "pending"
      ? baseColumnCount + 1
      : currentView === "approved"
        ? baseColumnCount + 2
        : baseColumnCount + 3;

  const formatDate = (value: string | null | undefined) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const formatLocation = (project: ProjectRow) => {
    if (project.place_name) return project.place_name;
    if (project.lat != null && project.lng != null) return `${project.lat}, ${project.lng}`;
    return "";
  };

  const formatOrganisation = (project: ProjectRow) => {
    return project.lead_org?.[0]?.name ?? "";
  };

  const currentCategoryLabel =
    CATEGORIES.find(category => category.id === currentCategory)?.label ?? "Environmental";

  return (
    <main className="p-6">
      <h1 className="mb-2 text-2xl font-semibold">Project Registrations — {currentCategoryLabel}</h1>
      <p className="mb-4 text-sm text-gray-600">
        Reviewing {currentCategoryLabel.toLowerCase()} project submissions.
      </p>

      {(messageParam || errorParam) && (
        <div
          className={clsx(
            "mb-4 rounded-lg border px-4 py-3 text-sm",
            errorParam
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700",
          )}
        >
          {errorParam ? errorParam : messageParam}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {CATEGORIES.map(category => (
          <Link
            key={category.id}
            href={{
              pathname: "/admin/registrations",
              query: { category: category.id, view: currentView },
            }}
            className={clsx(
              "rounded-full border px-4 py-1 text-sm transition",
              currentCategory === category.id
                ? "border-blue-600 bg-blue-600 text-white shadow"
                : "border-gray-200 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-600",
            )}
          >
            {category.label}
          </Link>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {VIEWS.map(view => (
          <Link
            key={view.id}
            href={{
              pathname: "/admin/registrations",
              query: { view: view.id, category: currentCategory },
            }}
            className={clsx(
              "rounded-full border px-4 py-1 text-sm transition",
              currentView === view.id
                ? "border-blue-600 bg-blue-600 text-white shadow"
                : "border-gray-200 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-600",
            )}
            title={view.description}
          >
            {view.label}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Organisation</th>
              <th className="px-4 py-2">Location</th>
              <th className="px-4 py-2">Submitted</th>

              {currentView === "approved" && (
                <>
                  <th className="px-4 py-2">Approved On</th>
                  <th className="px-4 py-2">Approved By</th>
                </>
              )}

              {currentView === "rejected" && (
                <>
                  <th className="px-4 py-2">Rejected On</th>
                  <th className="px-4 py-2">Rejected By</th>
                  <th className="px-4 py-2">Reason</th>
                </>
              )}

              <th className="px-4 py-2">Manage</th>
              {currentView === "pending" && <th className="px-4 py-2">Actions</th>}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={columnCount}>
                  No {currentView} projects found.
                </td>
              </tr>
            ) : (
              rows.map(project => {
                const projectSlug = project.slug ?? project.id;

                return (
                  <tr key={project.id} className="border-t">
                    <td className="px-4 py-3 font-medium text-gray-900">{project.name ?? ""}</td>
                    <td className="px-4 py-3">{formatOrganisation(project)}</td>
                    <td className="px-4 py-3">{formatLocation(project)}</td>
                    <td className="px-4 py-3">{formatDate(project.created_at)}</td>

                    {currentView === "approved" && (
                      <>
                        <td className="px-4 py-3">{formatDate(project.approved_at)}</td>
                        <td className="px-4 py-3">{project.approved_by ?? ""}</td>
                      </>
                    )}

                    {currentView === "rejected" && (
                      <>
                        <td className="px-4 py-3">{formatDate(project.rejected_at)}</td>
                        <td className="px-4 py-3">{project.rejected_by ?? ""}</td>
                        <td className="px-4 py-3">{project.rejection_reason ?? ""}</td>
                      </>
                    )}

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/projects/${project.id}`}
                          className="rounded border border-gray-300 px-3 py-1 text-gray-700 transition hover:bg-gray-50"
                        >
                          Admin
                        </Link>

                        <Link
                          href={`/projects/${projectSlug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded border border-blue-500 px-3 py-1 text-blue-600 transition hover:bg-blue-50"
                        >
                          Open
                        </Link>

                        <DeleteProjectButton
                          projectId={project.id}
                          category={currentCategory}
                          view={currentView}
                        />
                      </div>
                    </td>

                    {currentView === "pending" && (
                      <td className="px-4 py-3">
                        <form
                          action={`/api/admin/projects/${project.id}/approve`}
                          method="post"
                          className="inline"
                        >
                          <input type="hidden" name="category" value={currentCategory} />
                          <input type="hidden" name="view" value={currentView} />
                          <button className="rounded border border-emerald-500 px-3 py-1 text-emerald-600 transition hover:bg-emerald-50">
                            Approve
                          </button>
                        </form>

                        <form
                          action={`/api/admin/projects/${project.id}/reject`}
                          method="post"
                          className="ml-3 inline"
                        >
                          <input type="hidden" name="category" value={currentCategory} />
                          <input type="hidden" name="view" value={currentView} />
                          <input
                            name="reason"
                            placeholder="Reason"
                            className="mr-2 rounded border px-2 py-1"
                            aria-label="Rejection reason"
                          />
                          <button className="rounded border border-red-500 px-3 py-1 text-red-600 transition hover:bg-red-50">
                            Reject
                          </button>
                        </form>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        Approved projects show on the public map. Rejected projects appear in the rejected archive
        and can be revisited at any time.
      </p>
    </main>
  );
}
