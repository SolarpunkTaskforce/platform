import Link from "next/link";

import clsx from "clsx";

import { getServerSupabase } from "@/lib/supabaseServer";

type ProjectStatus = "pending" | "approved" | "rejected";

type SearchParams = Record<string, string | string[] | undefined>;

const VIEWS: { id: ProjectStatus; label: string; description: string }[] = [
  {
    id: "pending",
    label: "Pending",
    description: "Projects awaiting review. Approving will publish them on the map.",
  },
  {
    id: "approved",
    label: "Approved",
    description: "Approved projects appear with a pin on the public map.",
  },
  {
    id: "rejected",
    label: "Rejected",
    description: "Projects that were rejected. You can optionally provide a reason when rejecting.",
  },
];

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const supabase = await getServerSupabase();
  const { data: ok } = await supabase.rpc("is_admin");
  if (!ok) return new Response(null, { status: 404 }) as never;

  // TODO: surface full metadata in /admin/projects/[id]
  const { data: projects, error } = await supabase
    .from("projects")
    .select(
      "id,name,description,lat,lng,status,created_at,approved_at,approved_by,rejected_at,rejected_by,rejection_reason",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;

  const grouped: Record<ProjectStatus, typeof projects> = {
    pending: [],
    approved: [],
    rejected: [],
  };

  for (const project of projects ?? []) {
    const status = (project.status as ProjectStatus | null) ?? "pending";
    if (grouped[status]) {
      grouped[status]?.push(project);
    } else {
      grouped.pending?.push(project);
    }
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const currentViewParam = Array.isArray(resolvedSearchParams?.view)
    ? resolvedSearchParams?.view[0]
    : resolvedSearchParams?.view;
  const currentView: ProjectStatus =
    currentViewParam === "approved" || currentViewParam === "rejected"
      ? currentViewParam
      : "pending";

  const messageParam = Array.isArray(resolvedSearchParams?.message)
    ? resolvedSearchParams?.message[0]
    : resolvedSearchParams?.message;
  const errorParam = Array.isArray(resolvedSearchParams?.error)
    ? resolvedSearchParams?.error[0]
    : resolvedSearchParams?.error;

  const rows = grouped[currentView] ?? [];
  const columnCount = currentView === "pending" ? 3 : currentView === "approved" ? 4 : 5;

  const formatDate = (value: string | null | undefined) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  return (
    <main className="p-6">
      <h1 className="mb-6 text-2xl font-semibold">Project Registrations</h1>

      {(messageParam || errorParam) && (
        <div
          className={clsx(
            "mb-4 rounded-lg border px-4 py-3 text-sm",
            errorParam
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700",
          )}
        >
          {errorParam ?? messageParam}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {VIEWS.map(view => (
          <Link
            key={view.id}
            href={{ pathname: "/admin/registrations", query: { view: view.id } }}
            className={clsx(
              "rounded-full border px-4 py-1 text-sm transition",
              currentView === view.id
                ? "border-blue-600 bg-blue-600 text-white shadow"
                : "border-gray-200 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-600",
            )}
          >
            {view.label} ({grouped[view.id]?.length ?? 0})
          </Link>
        ))}
      </div>

      <p className="mb-4 text-sm text-gray-600">
        {VIEWS.find(view => view.id === currentView)?.description}
      </p>

      <div className="overflow-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
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
              rows.map(project => (
                <tr key={project.id} className="border-t">
                  <td className="px-4 py-3 font-medium text-gray-900">{project.name}</td>
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
                  {currentView === "pending" && (
                    <td className="px-4 py-3">
                      <form action={`/api/admin/projects/${project.id}/approve`} method="post" className="inline">
                        <button className="rounded border border-emerald-500 px-3 py-1 text-emerald-600 transition hover:bg-emerald-50">
                          Approve
                        </button>
                      </form>
                      <form action={`/api/admin/projects/${project.id}/reject`} method="post" className="ml-3 inline">
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
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Approved projects show on the public map. Rejected projects appear in the rejected archive and can be revisited at any time.
      </p>
    </main>
  );
}
