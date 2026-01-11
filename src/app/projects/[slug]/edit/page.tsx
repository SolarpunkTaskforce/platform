import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await getServerSupabase();
  const { slug } = await params;
  const query = searchParams ? await searchParams : {};

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

  const { data: collaborators } = await supabase.rpc("get_project_collaborators", {
    pid: project.id,
  });

  const shareStatus = typeof query.share === "string" ? query.share : null;
  const shareMessage =
    shareStatus === "ok"
      ? "Collaborator added."
      : shareStatus === "removed"
        ? "Collaborator removed."
        : shareStatus === "not_found"
          ? "User not found."
          : shareStatus === "not_allowed"
            ? "You are not allowed to share this project."
            : shareStatus === "invalid"
              ? "Please enter an email address."
              : null;

  async function inviteCollaborator(formData: FormData) {
    "use server";

    const email = String(formData.get("email") ?? "").trim();
    const role = String(formData.get("role") ?? "viewer").trim();
    const projectId = String(formData.get("project_id") ?? "").trim();

    if (!email) {
      redirect(`/projects/${slug}/edit?share=invalid#sharing`);
    }

    const supabase = await getServerSupabase();
    const { data: result, error: inviteError } = await supabase.rpc(
      "add_project_collaborator_by_email",
      {
        pid: projectId,
        email,
        role,
      },
    );

    const status = inviteError ? "not_allowed" : result ?? "not_allowed";
    revalidatePath(`/projects/${slug}/edit`);
    redirect(`/projects/${slug}/edit?share=${encodeURIComponent(status)}#sharing`);
  }

  async function removeCollaborator(formData: FormData) {
    "use server";

    const projectId = String(formData.get("project_id") ?? "").trim();
    const userId = String(formData.get("user_id") ?? "").trim();

    if (!projectId || !userId) {
      redirect(`/projects/${slug}/edit?share=not_allowed#sharing`);
    }

    const supabase = await getServerSupabase();
    await supabase
      .from("project_collaborators")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", userId);

    revalidatePath(`/projects/${slug}/edit`);
    redirect(`/projects/${slug}/edit?share=removed#sharing`);
  }

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

      <section id="sharing" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Sharing
          </h2>
          <p className="text-sm text-slate-600">
            Invite collaborators by email. Editors can update this project; viewers can
            view it.
          </p>
        </div>

        {shareMessage ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {shareMessage}
          </p>
        ) : null}

        <form action={inviteCollaborator} className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <input type="hidden" name="project_id" value={project.id} />
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Email address
            <input
              name="email"
              type="email"
              placeholder="name@example.com"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Role
            <select
              name="role"
              defaultValue="viewer"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
          </label>
          <button
            type="submit"
            className="mt-auto inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
          >
            Invite
          </button>
        </form>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">Collaborators</h3>
          {collaborators?.length ? (
            <ul className="space-y-2">
              {collaborators.map((collaborator) => {
                const name =
                  collaborator.full_name ??
                  collaborator.organisation_name ??
                  collaborator.email ??
                  "Collaborator";

                return (
                  <li
                    key={collaborator.user_id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {collaborator.email ?? "Email not available"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        {collaborator.role}
                      </span>
                      <form action={removeCollaborator}>
                        <input type="hidden" name="project_id" value={project.id} />
                        <input type="hidden" name="user_id" value={collaborator.user_id} />
                        <button
                          type="submit"
                          className="text-xs font-medium text-rose-600 hover:text-rose-700"
                        >
                          Remove
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-slate-600">No collaborators yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
