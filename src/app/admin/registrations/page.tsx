import { getServerSupabase } from "@/lib/supabaseServer";

export default async function Page() {
  const supabase = await getServerSupabase();
  const { data: ok } = await supabase.rpc("is_admin");
  if (!ok) return new Response(null, { status: 404 }) as never;

  // TODO: surface full metadata in /admin/projects/[id]
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id,name,description,lat,lng,status,created_at,approved_at,approved_by,rejected_at,rejected_by,rejection_reason")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (
    <main className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Project Registrations</h1>
      <div className="overflow-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Name","Status","Created","Approved By","Rejected By","Reason","Actions"].map(h => <th key={h} className="px-4 py-2 text-left">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {projects?.map(p => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2 capitalize">{p.status}</td>
                <td className="px-4 py-2">{new Date(p.created_at).toLocaleString()}</td>
                <td className="px-4 py-2">{p.approved_by ?? ""}</td>
                <td className="px-4 py-2">{p.rejected_by ?? ""}</td>
                <td className="px-4 py-2">{p.rejection_reason ?? ""}</td>
                <td className="px-4 py-2">
                  <form action={`/api/admin/projects/${p.id}/approve`} method="post" className="inline">
                    <button className="rounded border px-3 py-1 hover:bg-gray-50" disabled={p.status==="approved"}>Approve</button>
                  </form>
                  <form action={`/api/admin/projects/${p.id}/reject`} method="post" className="ml-2 inline">
                    <input name="reason" placeholder="Reason" className="mr-2 rounded border px-2 py-1" />
                    <button className="rounded border px-3 py-1 hover:bg-gray-50" disabled={p.status==="rejected"}>Reject</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-gray-500">Approved projects show on the map. Rejected projects appear in the rejected archive.</p>
    </main>
  );
}
