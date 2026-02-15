import { notFound } from "next/navigation";

import UpdatesSection, { type UpdateSummary } from "@/components/updates/UpdatesSection";
import { getServerSupabase } from "@/lib/supabaseServer";

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default async function WatchdogIssuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id || typeof id !== "string") notFound();

  const supabase = await getServerSupabase();

  const { data: issue, error } = await supabase
    .from("watchdog_issues")
    .select("*")
    .eq("id", id)
    .single();

  if (!issue) {
    notFound();
  }

  if (error) {
    throw new Error("Unable to load watchdog issue.");
  }

  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user ?? null;

  const { data: isAdmin } = await supabase.rpc("is_admin");
  const canEdit = Boolean(user && (issue.submitted_by === user.id || isAdmin));

  const locationParts = [issue.city, issue.region, issue.country].filter(Boolean) as string[];
  const locationLabel = locationParts.length > 0 ? locationParts.join(", ") : null;

  // Fetch watchdog issue updates
  const { data: watchdogUpdates } = await supabase
    .from("watchdog_issue_updates")
    .select("id,issue_id,author_user_id,title,body,visibility,published_at,created_at")
    .eq("issue_id", issue.id)
    .eq("visibility", "public")
    .order("published_at", { ascending: false })
    .limit(20);

  // Map watchdog_issue_updates to UpdateSummary format
  const updates: UpdateSummary[] = (watchdogUpdates ?? []).map(
    (update: { id: string; title: string; body: string; published_at: string }) => ({
      id: update.id,
      title: update.title,
      summary: update.body,
      created_at: update.published_at,
    }),
  );

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:space-y-8 sm:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-soltas-bark">
              {issue.title}
            </h1>
            {issue.urgency != null ? (
              <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-soltas-muted">
                Urgency: {issue.urgency}/10
              </span>
            ) : null}
          </div>

          {locationLabel ? <p className="mt-1 text-sm text-soltas-muted">{locationLabel}</p> : null}
          <p className="mt-1 text-sm text-soltas-muted">
            Reported on {formatDate(issue.created_at)}
          </p>
        </div>
      </header>

      {issue.description ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-soltas-muted">
            Description
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-soltas-bark">
            {issue.description}
          </p>
        </section>
      ) : null}

      <UpdatesSection
        updates={updates}
        isAuthenticated={Boolean(user)}
        canPost={canEdit}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-soltas-muted">Details</h2>

        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {issue.date_observed ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-soltas-muted">
                Date observed
              </dt>
              <dd className="text-sm text-soltas-bark">{formatDate(issue.date_observed)}</dd>
            </div>
          ) : null}

          {issue.urgency != null ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-soltas-muted">
                Urgency
              </dt>
              <dd className="text-sm text-soltas-bark">{issue.urgency} / 10</dd>
            </div>
          ) : null}

          {Array.isArray(issue.affected_demographics) && issue.affected_demographics.length > 0 ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-soltas-muted">
                Affected demographics
              </dt>
              <dd className="text-sm text-soltas-bark">
                {(issue.affected_demographics as string[]).join(", ")}
              </dd>
            </div>
          ) : null}

          {Array.isArray(issue.global_challenges) && issue.global_challenges.length > 0 ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-soltas-muted">
                Global challenges
              </dt>
              <dd className="mt-1 flex flex-wrap gap-2">
                {(issue.global_challenges as string[]).map((challenge: string) => (
                  <span
                    key={challenge}
                    className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-soltas-text"
                  >
                    {challenge}
                  </span>
                ))}
              </dd>
            </div>
          ) : null}

          {Array.isArray(issue.sdgs) && issue.sdgs.length > 0 ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-soltas-muted">
                SDGs
              </dt>
              <dd className="mt-1 flex flex-wrap gap-2">
                {(issue.sdgs as number[]).map((sdg: number) => (
                  <span
                    key={sdg}
                    className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-soltas-text"
                  >
                    SDG {sdg}
                  </span>
                ))}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>
    </main>
  );
}
