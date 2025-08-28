"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

const supabase = supabaseClient();

export default function AddProjectPage() {
  const router = useRouter();
  const [me, setMe] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [leadOrgId, setLeadOrgId] = useState<string | null>(null);
  const [country, setCountry] = useState("");
  const [thematicArea, setThematicArea] = useState("");
  const [fundingNeeded, setFundingNeeded] = useState<number | undefined>(undefined);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace("/auth");
      else setMe(data.user.id);
    });
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return;
    const { error } = await supabase.from("projects").insert({
      title,
      description,
      lead_org_id: leadOrgId,
      country,
      thematic_area: thematicArea,
      funding_needed: fundingNeeded,
      review_status: "pending",
      created_by: me,
    });
    if (error) { setStatusMsg(error.message); return; }
    setStatusMsg("Submitted for review. An admin will approve it.");
    setTitle(""); setDescription(""); setLeadOrgId(null); setCountry(""); setThematicArea(""); setFundingNeeded(undefined);
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Add Project</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full rounded-xl border px-3 py-2" placeholder="Project title" value={title} onChange={e=>setTitle(e.target.value)} required />
        <textarea className="w-full rounded-xl border px-3 py-2" placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />
        <input className="w-full rounded-xl border px-3 py-2" placeholder="Lead organisation ID (optional)" value={leadOrgId ?? ""} onChange={e=>setLeadOrgId(e.target.value || null)} />
        <div className="flex gap-3">
          <input className="w-full rounded-xl border px-3 py-2" placeholder="Country" value={country} onChange={e=>setCountry(e.target.value)} />
          <input className="w-full rounded-xl border px-3 py-2" placeholder="Thematic area" value={thematicArea} onChange={e=>setThematicArea(e.target.value)} />
        </div>
        <input type="number" className="w-full rounded-xl border px-3 py-2" placeholder="Funding needed (number)" value={fundingNeeded ?? ""} onChange={e=>setFundingNeeded(e.target.value ? Number(e.target.value) : undefined)} />
        <button type="submit" className="rounded-xl border px-3 py-2">Submit</button>
      </form>
      {statusMsg && <p className="mt-3 text-sm">{statusMsg}</p>}
      <p className="mt-6 text-xs opacity-70">MVP fields. Extend per blueprint later. Submissions enter pending review.</p>
    </div>
  );
}
