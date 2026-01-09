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

function asOptionalString(value: string | null | undefined) {
  return typeof value === "string" ? value : undefined;
}

function asOptionalNumber(value: number | null | undefined) {
  return typeof value === "number" ? value : undefined;
}

function asOptionalDate(value: string | null | undefined) {
  if (typeof value !== "string" || !value.length) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export default async function ProjectEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const supabase = await getServerSupabase();
  const { slug } = await params;

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

  const { data: canEdit } = await supabase.rpc("user_can_edit_project", { pid: project.id });
  if (!canEdit) notFound();

  const normalizedCategory: "humanitarian" | "environmental" =
    project.category === "humanitarian" ? "humanitarian" : "environmental";

  const hasLocation =
    typeof project.lat === "number" &&
    typeof project.lng === "number" &&
    typeof project.place_name === "string" &&
    project.place_name.length > 0;

  const initialValues = {
    // Strict union expected by ProjectForm
    category: normalizedCategory,

    // Strings: use empty string for required user-facing fields
    name: project.name ?? "",
    description: project.description ?? "",

    // Optional strings should be undefined, not null
    lead_org_id: asOptionalString(project.lead_org_id),

    // ProjectForm appears to use `location: ... | null`
    location: hasLocation
      ? { lat: project.lat as number, lng: project.lng as number, place_name: project.place_name as string }
      : null,

    // Arrays: default to []
    type_of_intervention: Array.isArray(project.type_of_intervention) ? project.type_of_intervention : [],
    thematic_area: Array.isArray(project.thematic_area) ? project.thematic_area : [],

    // Optional strings: undefined, not null
    target_demographic: project.target_demographic ?? "",

    // Optional numbers: undefined, not null
    lives_improved: asOptionalNumber(project.lives_improved),
    donations_received: asOptionalNumber(project.donations_received),
    amount_needed: asOptionalNumber(project.amount_needed),

    // Dates: undefined, not null (ProjectForm expects undefined)
    start_date: asOptionalDate(project.start_date),
    end_date: asOptionalDate(project.end_date),

    currency: project.currency ?? "USD",

    // Links: keep at least one row for UI; label can be undefined
    links:
      project.project_links?.length
        ? project.project_links
            .filter(l => typeof l.url === "string" && l.url.length > 0)
            .map(l => ({ url: l.url as string, label: l.label ?? undefined }))
        : [{ url: "", label: undefined }],

    // partner_org_ids must be string[]
    partner_org_ids:
      project.project_partners
        ?.map(p => p.organisation_id)
        .filter((v): v is string => typeof v === "string" && v.length > 0) ?? [],

    // sdg_ids must be number[]
    sdg_ids:
      project.project_sdgs
        ?.map(s => s.sdg_id)
        .filter((v): v is number => typeof v === "number") ?? [],

    // ifrc_ids must be number[]
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
