import Link from "next/link";
import { notFound } from "next/navigation";

import FollowButton from "@/components/FollowButton";
import { SocialLinks } from "@/components/profiles/SocialLinks";
import UpdatesSection, { type UpdateSummary } from "@/components/updates/UpdatesSection";
import { getServerSupabase } from "@/lib/supabaseServer";

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default async function OrganisationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id || typeof id !== "string") notFound();

  const supabase = await getServerSupabase();

  const { data: organisation, error } = await supabase
    .from("organisations")
    .select(
      "id,name,country_based,what_we_do,existing_since,website,social_links,logo_url,created_at,created_by,verification_status",
    )
    .eq("id", id)
    .single();

  if (!organisation) {
    notFound();
  }

  if (error) {
    throw new Error("Unable to load organisation.");
  }

  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user ?? null;

  const { data: isAdmin } = await supabase.rpc("is_admin");
  const canEdit = Boolean(user && (organisation.created_by === user.id || isAdmin));

  // Check if user is an org admin/owner
  const { data: userMembership } = user
    ? await supabase
        .from("organisation_members")
        .select("role")
        .eq("organisation_id", organisation.id)
        .eq("user_id", user.id)
        .single()
    : { data: null };

  const isOrgAdmin = userMembership?.role === "admin" || userMembership?.role === "owner";

  const { count: followerCount, error: followerCountError } = await supabase
    .from("follow_edges")
    .select("id", { count: "exact", head: true })
    .eq("target_type", "org")
    .eq("target_org_id", organisation.id);

  const { data: followEdge, error: followEdgeError } = user
    ? await supabase
        .from("follow_edges")
        .select("id")
        .eq("target_type", "org")
        .eq("target_org_id", organisation.id)
        .eq("follower_user_id", user.id)
        .maybeSingle()
    : { data: null, error: null };

  const { count: memberCount, error: memberError } = await supabase
    .from("organisation_members")
    .select("user_id", { count: "exact", head: true })
    .eq("organisation_id", organisation.id);

  const { count: projectCount, error: projectError } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("lead_org_id", organisation.id);

  const resolvedMemberCount = memberError ? null : memberCount ?? 0;
  const resolvedProjectCount = projectError ? null : projectCount ?? 0;
  const resolvedFollowerCount = followerCountError ? null : followerCount ?? 0;
  const isFollowing = Boolean(followEdge && !followEdgeError);
  const isVerified = organisation.verification_status === "verified";

  // Fetch organisation updates
  const { data: organisationUpdates } = await supabase
    .from("organisation_updates")
    .select("id,organisation_id,author_user_id,title,body,visibility,published_at,created_at")
    .eq("organisation_id", organisation.id)
    .eq("visibility", "public")
    .order("published_at", { ascending: false })
    .limit(20);

  // Map organisation_updates to UpdateSummary format
  const updates: UpdateSummary[] = (organisationUpdates ?? []).map(
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
        <div className="flex min-w-0 items-start gap-4">
          {organisation.logo_url ? (
            <img
              src={organisation.logo_url}
              alt={organisation.name}
              className="h-14 w-14 rounded-2xl border border-slate-200 object-cover sm:h-20 sm:w-20"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-soltas-muted sm:h-20 sm:w-20">
              —
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-soltas-bark">
                {organisation.name}
              </h1>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  <span aria-hidden>✓</span> Verified
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-soltas-muted">
              On Solarpunk Taskforce since {formatDate(organisation.created_at)}
            </p>
            {organisation.country_based ? (
              <p className="mt-1 text-sm text-soltas-muted">Based in {organisation.country_based}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          {canEdit ? (
            <>
              <Link
                href={`/organisations/${organisation.id}/edit`}
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Edit Organisation
              </Link>
              {isOrgAdmin ? (
                <Link
                  href={`/organisations/${organisation.id}/members`}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                >
                  Manage Members
                </Link>
              ) : null}
            </>
          ) : (
            <FollowButton
              targetType="org"
              targetId={organisation.id}
              initialIsFollowing={isFollowing}
              initialFollowerCount={resolvedFollowerCount}
              isAuthenticated={Boolean(user)}
            />
          )}
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-soltas-muted">Overview</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-soltas-muted">
              What we do
            </dt>
            <dd className="text-sm text-soltas-bark">
              {organisation.what_we_do ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-soltas-muted">
              Existing since
            </dt>
            <dd className="text-sm text-soltas-bark">
              {organisation.existing_since ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-soltas-muted">Website</dt>
            <dd className="text-sm text-soltas-bark">
              {organisation.website ? (
                <Link
                  href={organisation.website}
                  className="font-medium text-soltas-ocean hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {organisation.website}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-soltas-muted">
              Social links
            </dt>
            <dd className="mt-2">
              <SocialLinks links={organisation.social_links} />
            </dd>
          </div>
        </dl>
      </section>

      <UpdatesSection
        updates={updates}
        isAuthenticated={Boolean(user)}
        canPost={canEdit}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-soltas-muted">Stats</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-soltas-muted">
              Members
            </dt>
            <dd className="text-sm text-soltas-bark">
              {resolvedMemberCount === null ? "—" : resolvedMemberCount}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-soltas-muted">
              Projects
            </dt>
            <dd className="text-sm text-soltas-bark">
              {resolvedProjectCount === null ? "—" : resolvedProjectCount}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-soltas-muted">
              Followers
            </dt>
            <dd className="text-sm text-soltas-bark">
              {resolvedFollowerCount === null ? "—" : resolvedFollowerCount}
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
