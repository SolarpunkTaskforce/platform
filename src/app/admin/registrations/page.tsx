import { getServerSupabase } from "@/lib/supabaseServer";
import { notFound } from "next/navigation";

async function fetchAllProjects() {
  const supabase = getServerSupabase();
  const { data: ok } = await supabase.rpc("is_admin");
  if (!ok) return { forbidden: true } as const;

  // select everything admins need to review
  const { data, error } = await supabase
    .from("projects")
    .select(`
      id, title, description, lat, lng, approval_status,
      created_at, created_by,
      approved_at, approved_by,
      rejected_at, rejected_by, rejection_reason
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return { projects: data } as const;
}

export default async function Page() {
  const res = await fetchAllProjects();
  if ("forbidden" in res) return notFound();

  const projects = res.projects!;
  return (
    <main className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Project Registrations</h1>
      <div className="overflow-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Title","Status","Created","Approved By","Rejected By","Actions"].map(h => (
                <th key={h} className="px-4 py-2 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-2">{p.title}</td>
                <td className="px-4 py-2 capitalize">{p.approval_status}</td>
                <td className="px-4 py-2">{new Date(p.created_at).toLocaleString()}</td>
                <td className="px-4 py-2">{p.approved_by ?? ""}</td>
                <td className="px-4 py-2">{p.rejected_by ?? ""}</td>
                <td className="px-4 py-2">
                  <form action={`/api/admin/projects/${p.id}/approve`} method="post" className="inline">
                    <button className="rounded border px-3 py-1 text-sm hover:bg-gray-50" disabled={p.approval_status==="approved"}>Approve</button>
                  </form>
                  <form action={`/api/admin/projects/${p.id}/reject`} method="post" className="ml-2 inline">
                    <input type="hidden" name="reason" value="" />
                    <button className="rounded border px-3 py-1 text-sm hover:bg-gray-50" disabled={p.approval_status==="rejected"}>Reject</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Note: Approved projects appear on the map. Rejected projects go to the rejected archive.
      </p>
    </main>
  );
}
