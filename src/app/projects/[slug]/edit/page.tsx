import { notFound } from "next/navigation";

import ProjectForm from "@/components/projects/ProjectForm";
import { getServerSupabase } from "@/lib/supabaseServer";

type ProjectRow = {
  id: string;
  slug: string | null;
  name: string | null;
  description: string | null;
  category: string | null;
  lead_org_id: string | null;
  lat: number | null;
  lng: number | null;
  place_name: string | null;
  type_of_intervention: string[] | null;
  target_demographic: string | null;
  lives_improved: number | null;
  start_date: string | null;
  end_date: string | null;
  thematic_area: string[] | null;
  donations_received: number | null;
  amount_needed: number | null;
  currency: string | null;
};

type LinkRow = { label: string | null; url: string | null };
type PartnerRow = { organisation_id: string | null };
type SdgRow = { sdg_id: number | null };
type IfrcRow = { challenge_id: number | null };

export default async function ProjectEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const supabase = await getServerSupabase();
  const { slug } = await params;

  // Fetch by slug; RLS will prevent fetching if user cannot view.
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      slug,
      name,
      description,
      category,
      lead_org_id,
      lat,
      lng,
      place_name,
      type_of_intervention,
      target_demographic,
      lives_improved,
      start_date,
      end_date,
      thematic_area,
      donations_received,
      amount_needed,
      currency,
      project_links:project_links(label,url),
      project_partners:project_partners(organisation_id),
      project_sdgs:project_sdgs(sdg_id),
      project_ifrc_challenges:project_ifrc_challenges(challenge_id)
      `,
    )
    .eq("slug", slug)
    .single();

  if (error || !data) notFound();

  const project = data as unknown as ProjectRow & {
    project_links?: LinkRow[] | null;
    project_partners?: PartnerRow[] | null;
    project_sdgs?: SdgRow[] | null;
    project_ifrc_challenges?: IfrcRow[] | null;
  };

  // Now check edit permission explicitly (still relying on RLS, but makes intent clear).
  const { data: canEdit } = await supabase.rpc("user_can_edit_project", { pid: project.id });
  if (!canEdit) notFound();

  const initialValues = {
    category: project.category ?? "environmental",
    name: project.name ?? "",
    description: project.description ?? "",
    lead_org_id: project.lead_org_id ?? undefined,
    location:
      typeof project.lat === "number" && typeof project.lng === "number" && project.place_name
        ? { lat: project.lat, lng: project.lng, place_name: project.place_name }
        : null,
    type_of_intervention: project.type_of_intervention ?? [],
    thematic_area: project.thematic_area ?? [],
    target_demographic: project.target_demographic ?? "",
    lives_improved: project.lives_improved ?? null,
    start_date: project.start_date ?? null,
    end_date: project.end_date ?? null,
    donations_received: project.donations_received ?? null,
    amount_needed: project.amount_needed ?? null,
    currency: project.currency ?? "USD",
    links:
      project.project_links?.length
        ? project.project_links.map(l => ({ url: l.url ?? "", label: l.label ?? "" }))
        : [{ url: "", label: "" }],
    partner_org_ids:
      project.project_partners?.map(p => p.organisation_id).filter(Boolean) ?? [],
    sdg_ids:
      project.project_sdgs?.map(s => s.sdg_id).filter((v): v is number => typeof v === "number") ??
      [],
    ifrc_ids:
      project.project_ifrc_challenges
        ?.map(i => i.challenge_id)
        .filter((v): v is number => typeof v === "number") ?? [],
  };

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Edit project</h1>
        <p className="text-sm text-slate-600">
          Changes are saved under the same access rules (owner/admin/shared editors).
        </p>
      </div>

      <ProjectForm mode="edit" projectId={project.id} initialValues={initialValues} />
    </main>
  );
}
