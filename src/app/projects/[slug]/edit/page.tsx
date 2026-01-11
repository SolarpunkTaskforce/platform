import { notFound } from "next/navigation";
import Link from "next/link";

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

// ✅ This is the missing type that fixes the implicit-any build error
type Collaborator = {
  user_id: string;
  role: "viewer" | "editor";
  email: string | null;
  full_name: string | null;
  organisation_name: string | null;
};

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

  // Collaborators (for Sharing UI). This RPC should already exist from your collaboration work.
  // If your RPC is named differently, rename it here.
  const { data: collaboratorsData } = await supabase.rpc("get_project_collaborators", {
    pid: project.id,
  });

  const collaborators = (collaboratorsData ?? []) as Collaborator[];

  const normalizedCategory: "humanitarian" | "environmental" =
    project.category === "humanitarian" ? "humanitarian" : "environmental";

  const hasLocation =
    typeof project.lat === "number" &&
    typeof project.lng === "number" &&
    typeof project.place_name === "string" &&
    project.place_name.length > 0;

  const initialValues = {
    category: normalizedCategory,
    name: project.name ?? "",
    description: project.description ?? "",
    lead_org_id: asOptionalString(project.lead_org_id),
    location: hasLocation
      ? {
          lat: project.lat as number,
          lng: project.lng as number,
          place_name: project.place_name as string,
        }
      : null,
    type_of_intervention: Array.isArray(project.type_of_intervention) ? project.type_of_intervention : [],
    thematic_area: Array.isArray(project.thematic_area) ? project.thematic_area : [],
    target_demographic: project.target_demographic ?? "",
    lives_improved: asOptionalNumber(project.lives_improved),
    donations_received: asOptionalNumber(project.donations_received),
    amount_needed: asOptionalNumber(project.amount_needed),
    start_date: asOptionalDate(project.start_date),
    end_date: asOptionalDate(project.end_date),
    currency: project.currency ?? "USD",
    links:
      project.project_links?.length
        ? project.project_links
            .filter(l => typeof l.url === "string" && l.url.length > 0)
            .map(l => ({ url: l.url as string, label: l.label ?? undefined }))
        : [{ url: "", label: undefined }],
    partner_org_ids:
      project.project_partners
        ?.map(p => p.organisation_id)
        .filter((v): v is string => typeof v === "string" && v.length > 0) ?? [],
    sdg_ids:
      project.project_sdgs?.map(s => s.sdg_id).filter((v): v is number => typeof v === "number") ?? [],
    ifrc_ids:
      project.project_ifrc_challenges
        ?.map(i => i.challenge_id)
        .filter((v): v is number => typeof v === "number") ?? [],
  };

  return (
    <main className="mx-auto max-w-4xl space-y-10 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Edit project</h1>
        <p className="text-sm text-slate-600">
          Changes are saved under the same access rules (owner/admin/shared editors).
        </p>
      </div>

      <ProjectForm mode="edit" projectId={project.id} initialValues={initialValues} />

      {/* Sharing */}
      <section id="sharing" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Sharing</h2>
            <p className="mt-1 text-sm text-slate-600">
              Invite collaborators to view or edit this project. Access is enforced by Supabase RLS.
            </p>
          </div>

          <Link
            href={`/projects/${encodeURIComponent(project.slug ?? project.id)}`}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            View public page
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">Collaborators</h3>

          {collaborators.length ? (
            <ul className="space-y-2">
              {collaborators.map((collaborator: Collaborator) => {
                const name =
                  collaborator.full_name ??
                  collaborator.organisation_name ??
                  collaborator.email ??
                  collaborator.user_id;

                return (
                  <li
                    key={collaborator.user_id}
                    className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-900">{name}</div>
                      <div className="truncate text-xs text-slate-500">
                        {collaborator.email ?? "—"} · {collaborator.role}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-slate-600">No collaborators yet.</p>
          )}

          <p className="text-xs text-slate-500">
            To invite/remove collaborators, use the invite controls implemented in your collaboration UI (this section
            only fixes the typing error causing Vercel to fail).
          </p>
        </div>
      </section>
    </main>
  );
}
