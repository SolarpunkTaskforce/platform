import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSupabase } from "@/lib/supabaseServer";
import Map from "@/components/Map";

export default async function AdminProjectDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await getServerSupabase();
  const { id } = await params;
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return new Response(null, { status: 404 }) as never;

  const { data: project, error } = await supabase
    .from("projects")
    .select(
      `
    id,name,description,lat,lng,status,created_at,
    lead_org_id,
    start_date,end_date,thematic_area,donations_received,amount_needed,currency,
    approved_at,approved_by,rejected_at,rejected_by,rejection_reason
  `
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  if (!project) return notFound();

  const metadata: { label: string; value: string | null }[] = [
    { label: "Status", value: project.status },
    { label: "Created", value: new Date(project.created_at).toLocaleString() },
    { label: "Lead Org", value: project.lead_org_id },
    {
      label: "Timeline",
      value:
        project.start_date || project.end_date
          ? [project.start_date, project.end_date].filter(Boolean).join(" → ")
          : null,
    },
    { label: "Thematic Area", value: project.thematic_area },
    {
      label: "Funding",
      value:
        project.amount_needed || project.donations_received
          ? `${project.currency ?? ""} ${project.donations_received ?? 0} raised / ${project.amount_needed ?? "?"}`
          : null,
    },
    { label: "Approved By", value: project.approved_by },
    {
      label: "Approved At",
      value: project.approved_at ? new Date(project.approved_at).toLocaleString() : null,
    },
    { label: "Rejected By", value: project.rejected_by },
    {
      label: "Rejected At",
      value: project.rejected_at ? new Date(project.rejected_at).toLocaleString() : null,
    },
    { label: "Rejection Reason", value: project.rejection_reason },
  ];

  const hasLocation = typeof project.lat === "number" && typeof project.lng === "number";

  return (
    <main className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="text-sm text-gray-600">Project ID: {project.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={`/api/admin/projects/${project.id}/approve`} method="post">
            <button className="rounded border px-4 py-2 hover:bg-gray-50">Approve</button>
          </form>
          <form
            action={`/api/admin/projects/${project.id}/reject`}
            method="post"
            className="flex gap-2"
          >
            <input
              name="reason"
              placeholder="Reason"
              className="rounded border px-3 py-2"
              required
            />
            <button className="rounded border px-4 py-2 hover:bg-gray-50">Reject</button>
          </form>
          <Link
            href="/admin/projects"
            className="rounded border px-4 py-2 hover:bg-gray-50"
          >
            Back to list
          </Link>
        </div>
      </div>

      <section className="rounded-xl border p-4">
        <h2 className="mb-3 text-lg font-medium">Metadata</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          {metadata
            .filter(item => item.value)
            .map(item => (
              <div key={item.label}>
                <dt className="text-xs uppercase tracking-wide text-gray-500">
                  {item.label}
                </dt>
                <dd className="text-sm text-gray-900">{item.value}</dd>
              </div>
            ))}
        </dl>
      </section>

      {hasLocation && (
        <section className="rounded-xl border p-4">
          <h2 className="mb-3 text-lg font-medium">Location</h2>
          <p className="mb-3 text-sm text-gray-600">
            Coordinates: {project.lat?.toFixed(4)}, {project.lng?.toFixed(4)}
          </p>
          <div className="h-64 overflow-hidden rounded-lg">
            <Map
              markers={[
                {
                  id: project.id,
                  lat: project.lat as number,
                  lng: project.lng as number,
                  title: project.name,
                },
              ]}
            />
          </div>
        </section>
      )}

      <section className="rounded-xl border p-4">
        <h2 className="mb-3 text-lg font-medium">Description</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-gray-800">
          {project.description || "No description provided."}
        </p>
      </section>
    </main>
  );
}
