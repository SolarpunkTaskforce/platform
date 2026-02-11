import Link from "next/link";
import { notFound } from "next/navigation";

import FollowButton from "@/components/FollowButton";
import { SocialLinks } from "@/components/profiles/SocialLinks";
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
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500 sm:h-20 sm:w-20">
              —
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900">
                {organisation.name}
              </h1>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  <span aria-hidden>✓</span> Verified
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-slate-600">
              On Solarpunk Taskforce since {formatDate(organisation.created_at)}
            </p>
            {organisation.country_based ? (
              <p className="mt-1 text-sm text-slate-600">Based in {organisation.country_based}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          {canEdit ? (
            <Link
              href={`/organisations/${organisation.id}/edit`}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Edit Organisation
            </Link>
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
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Overview</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              What we do
            </dt>
            <dd className="text-sm text-slate-900">
              {organisation.what_we_do ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Existing since
            </dt>
            <dd className="text-sm text-slate-900">
              {organisation.existing_since ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Website</dt>
            <dd className="text-sm text-slate-900">
              {organisation.website ? (
                <Link
                  href={organisation.website}
                  className="font-medium text-emerald-700 hover:underline"
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
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Social links
            </dt>
            <dd className="mt-2">
              <SocialLinks links={organisation.social_links} />
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Stats</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Members
            </dt>
            <dd className="text-sm text-slate-900">
              {resolvedMemberCount === null ? "—" : resolvedMemberCount}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Projects
            </dt>
            <dd className="text-sm text-slate-900">
              {resolvedProjectCount === null ? "—" : resolvedProjectCount}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Followers
            </dt>
            <dd className="text-sm text-slate-900">
              {resolvedFollowerCount === null ? "—" : resolvedFollowerCount}
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
