import Link from "next/link";
import { notFound } from "next/navigation";

import type { Database } from "@/lib/database.types";
import { getServerSupabase } from "@/lib/supabaseServer";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type ProjectLinksRow = Database["public"]["Tables"]["project_links"]["Row"];
type ProjectMediaRow = Database["public"]["Tables"]["project_media"]["Row"];
type OrganisationRow = Database["public"]["Tables"]["organisations"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type ProjectDetail = ProjectRow & {
  lead_organisation: Pick<OrganisationRow, "id" | "name" | "website"> | null;
  project_links: ProjectLinksRow[];
  project_media: ProjectMediaRow[];
  created_by_profile: Pick<ProfileRow, "full_name" | "organisation_name" | "role"> | null;
};

type RawProjectDetail = ProjectRow & {
  lead_organisation: Pick<OrganisationRow, "id" | "name" | "website">[] | null;
  project_links: ProjectLinksRow[] | null;
  project_media: ProjectMediaRow[] | null;
  created_by_profile: Pick<ProfileRow, "full_name" | "organisation_name" | "role">[] | null;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "—";
  return new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "short", day: "2-digit" }).format(date);
}

function formatMoney(amount: number | null, currency: string | null) {
  if (amount === null || amount === undefined) return "—";
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency ?? "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return currency ? `${currency} ${amount}` : `${amount}`;
  }
}

function parseJsonLinks(value: ProjectRow["links"]) {
  if (!value) return [] as { label?: string | null; url?: string | null }[];
  if (Array.isArray(value)) return value as { label?: string | null; url?: string | null }[];
  if (typeof value === "object" && value !== null) return Object.values(value) as { label?: string | null; url?: string | null }[];
  return [];
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const supabase = await getServerSupabase();

  // Rely on RLS to decide whether the current visitor can see the project.
  // We *also* enforce approved-only content for public project pages.
  const { data, error } = await supabase
    .from("projects")
    .select(
      `*,
       lead_organisation:organisations!projects_lead_org_id_fkey(id,name,website),
       project_links:project_links(id,label,url,created_at),
       project_media:project_media(id,path,caption,mime_type,created_at),
       created_by_profile:profiles(full_name,organisation_name,role)
      `
    )
    .eq("slug", slug)
    .eq("status", "approved")
    .single();

  if (error || !data) {
    // If the slug doesn't exist OR the visitor isn't allowed by RLS, we 404.
    notFound();
  }

  const raw = data as RawProjectDetail;

  const project: ProjectDetail = {
    ...raw,
    lead_organisation: raw.lead_organisation?.[0] ?? null,
    created_by_profile: raw.created_by_profile?.[0] ?? null,
    project_links: raw.project_links ?? [],
    project_media: raw.project_media ?? [],
  };

  // Fine-grained edit rights (owner/admin/editor share) are enforced in RLS for writes,
  // but we use the SQL helper to conditionally show edit UI.
  const { data: canEdit } = await supabase.rpc("user_can_edit_project", { pid: project.id });

  const links = [
    ...project.project_links.map(l => ({ label: l.label, url: l.url })),
    ...parseJsonLinks(project.links),
  ].filter(l => l?.url);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 pb-10 pt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">{project.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-700">
              {project.category}
            </span>
            <span>·</span>
            <span className="capitalize">{project.lifecycle_status}</span>
            {project.place_name ? (
              <>
                <span>·</span>
                <span>{project.place_name}</span>
              </>
            ) : null}
          </div>
        </div>

        {canEdit ? (
          <div className="flex gap-2">
            <Link
              href={`/projects/${slug}/edit`}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Edit
            </Link>
            <Link
              href={`/projects/${slug}/edit#sharing`}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
            >
              Share
            </Link>
          </div>
        ) : null}
      </div>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">About</h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{project.description || "—"}</p>
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Organisation</h2>

          {project.lead_organisation ? (
            <div className="space-y-1">
              <div className="text-sm font-medium text-slate-900">{project.lead_organisation.name}</div>
              {project.lead_organisation.website ? (
                <Link
                  href={project.lead_organisation.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-emerald-700 hover:underline"
                >
                  {project.lead_organisation.website}
                </Link>
              ) : (
                <div className="text-sm text-slate-500">No website listed.</div>
              )}
            </div>
          ) : (
            <div className="text-sm text-slate-500">No lead organisation listed.</div>
          )}

          {project.created_by_profile ? (
            <div className="mt-4 text-xs text-slate-500">
              Submitted by{" "}
              <span className="font-medium text-slate-700">{project.created_by_profile.full_name || "—"}</span>
              {project.created_by_profile.organisation_name ? (
                <>
                  {" "}
                  · <span>{project.created_by_profile.organisation_name}</span>
                </>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Key details</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Country</dt>
              <dd className="mt-1 text-slate-800">{project.country || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Region</dt>
              <dd className="mt-1 text-slate-800">{project.region || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Start</dt>
              <dd className="mt-1 text-slate-800">{formatDate(project.start_date)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">End</dt>
              <dd className="mt-1 text-slate-800">{formatDate(project.end_date)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Funding needed</dt>
              <dd className="mt-1 text-slate-800">{formatMoney(project.amount_needed, project.currency)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Donations received</dt>
              <dd className="mt-1 text-slate-800">{formatMoney(project.donations_received, project.currency)}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Links</h2>
        {links.length === 0 ? (
          <p className="text-sm text-slate-500">No links provided.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {links.map((link, idx) => (
              <li key={`${link.url}-${idx}`} className="flex items-center justify-between gap-3">
                <span className="truncate text-slate-900">{link.label || link.url}</span>
                <Link href={String(link.url)} target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline">
                  Open
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Media</h2>
        {project.project_media.length === 0 ? (
          <p className="text-sm text-slate-500">No media uploaded.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {project.project_media.map(item => (
              <li key={item.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium text-slate-900">{item.caption || item.path}</div>
                  <div className="text-xs text-slate-500">{item.mime_type || "Unknown type"}</div>
                </div>
                <Link href={item.path} target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline">
                  View
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
