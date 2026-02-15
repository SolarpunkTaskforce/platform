import Link from "next/link";

import { FeedItemCard } from "@/components/feed/FeedItemCard";
import { getServerSupabase } from "@/lib/supabaseServer";

const PAGE_SIZE = 30;

type FeedItem = {
  id: string;
  event_type: string;
  actor_user_id: string | null;
  project_id: string | null;
  org_id: string | null;
  person_profile_id: string | null;
  update_id: string | null;
  created_at: string | null;
  title: string | null;
  summary: string | null;
};

type ProfileSummary = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

type ProjectSummary = { id: string; name: string | null; slug: string | null };

type OrganisationSummary = { id: string; name: string | null };

function getProfileName(profile: ProfileSummary | null) {
  if (!profile) return "Someone";
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
  return fullName || "Someone";
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const tabParam = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const cursorParam = Array.isArray(params.cursor) ? params.cursor[0] : params.cursor;

  const supabase = await getServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user ?? null;

  // Determine active tab - default to popular if logged out, following if logged in
  type TabValue = "popular" | "following" | "watchdog" | "funding";
  const validTabs: TabValue[] = ["popular", "following", "watchdog", "funding"];
  const tabValue = validTabs.includes(tabParam as TabValue) ? (tabParam as TabValue) : null;
  const activeTab: TabValue = tabValue ?? (user ? "following" : "popular");

  // Map tabs to RPC scopes
  let scope: "global" | "for_you" | "watchdog" | "funding";

  if (activeTab === "following") {
    scope = "for_you";
  } else if (activeTab === "popular") {
    scope = "global";
  } else if (activeTab === "watchdog") {
    scope = "watchdog";
  } else if (activeTab === "funding") {
    scope = "funding";
  } else {
    scope = "global";
  }

  const [cursorCreatedAt, cursorId] = cursorParam?.split("|") ?? [];

  const { data: feedItems, error: feedError } = await supabase.rpc("get_activity_feed_items", {
    scope,
    cursor_created_at: cursorCreatedAt ?? null,
    cursor_id: cursorId ?? null,
    page_size: PAGE_SIZE,
  });

  if (feedError) {
    throw new Error(feedError.message ?? "Unable to load feed.");
  }

  const items = (feedItems ?? []) as FeedItem[];

  const actorIds = new Set<string>();
  const personIds = new Set<string>();
  const projectIds = new Set<string>();
  const orgIds = new Set<string>();

  items.forEach((item) => {
    if (item.actor_user_id) actorIds.add(item.actor_user_id);
    if (item.person_profile_id) personIds.add(item.person_profile_id);
    if (item.project_id) projectIds.add(item.project_id);
    if (item.org_id) orgIds.add(item.org_id);
  });

  const profileIds = Array.from(new Set([...actorIds, ...personIds]));

  const profilesPromise = profileIds.length
    ? supabase
        .from("profiles")
        .select("id,first_name,last_name,avatar_url")
        .in("id", profileIds)
    : Promise.resolve({ data: [] as ProfileSummary[] });

  const projectsPromise = projectIds.size
    ? supabase.from("projects").select("id,name,slug").in("id", Array.from(projectIds))
    : Promise.resolve({ data: [] as ProjectSummary[] });

  const organisationsPromise = orgIds.size
    ? supabase.from("organisations").select("id,name").in("id", Array.from(orgIds))
    : Promise.resolve({ data: [] as OrganisationSummary[] });

  const [profilesResult, projectsResult, organisationsResult] = await Promise.all([
    profilesPromise,
    projectsPromise,
    organisationsPromise,
  ]);

  const profilesMap = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]));
  const projectsMap = new Map((projectsResult.data ?? []).map((project) => [project.id, project]));
  const organisationsMap = new Map(
    (organisationsResult.data ?? []).map((org) => [org.id, org])
  );

  const hasMore = items.length === PAGE_SIZE;
  const lastItem = items[items.length - 1];
  const nextCursor = lastItem ? `${lastItem.created_at}|${lastItem.id}` : null;

  const nextParams = new URLSearchParams();
  nextParams.set("tab", activeTab);
  if (nextCursor) nextParams.set("cursor", nextCursor);

  const { data: discoverPeople } = await supabase
    .from("profiles")
    .select("id,first_name,last_name,avatar_url")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: discoverOrgs } = await supabase
    .from("organisations")
    .select("id,name")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: discoverProjects } = await supabase
    .from("projects")
    .select("id,name,slug")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:space-y-8 sm:py-10">
      <header className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-soltas-bark">Activity feed</h1>
          <p className="text-sm text-soltas-muted">
            Calm, chronological updates from projects and people you follow.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/feed?tab=popular"
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === "popular"
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-soltas-text hover:bg-slate-50"
            }`}
          >
            Popular
          </Link>
          <Link
            href="/feed?tab=following"
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === "following"
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-soltas-text hover:bg-slate-50"
            }`}
          >
            Following
          </Link>
          <Link
            href="/feed?tab=watchdog"
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === "watchdog"
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-soltas-text hover:bg-slate-50"
            }`}
          >
            Watchdog
          </Link>
          <Link
            href="/feed?tab=funding"
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === "funding"
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-soltas-text hover:bg-slate-50"
            }`}
          >
            Funding
          </Link>
        </div>
      </header>

      {activeTab === "following" && !user ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-soltas-muted">
          Sign in to see updates from the people, organisations, and projects you follow.
        </div>
      ) : items.length ? (
        <section className="space-y-4">
          {items.map((item) => {
            const actor = profilesMap.get(item.actor_user_id ?? "") ?? null;
            const actorName = getProfileName(actor);

            // ✅ FIX: ensure this is ProfileSummary | null (never undefined)
            const targetPerson: ProfileSummary | null = item.person_profile_id
              ? profilesMap.get(item.person_profile_id) ?? null
              : null;

            const project = item.project_id ? projectsMap.get(item.project_id) : null;
            const organisation = item.org_id ? organisationsMap.get(item.org_id) : null;

            let title = "Activity";
            let href: string | null = null;

            if (item.event_type === "project_update") {
              const projectName = project?.name ?? "a project";
              title = `${projectName} · ${item.title ?? "Project update"}`;
              href = `/projects/${project?.slug ?? item.project_id}`;
            } else if (item.event_type === "org_update") {
              const orgName = organisation?.name ?? "an organisation";
              title = `${orgName} · ${item.title ?? "Organisation update"}`;
              href = `/organisations/${item.org_id}`;
            } else if (item.event_type === "watchdog_update") {
              title = item.title ?? "Watchdog issue reported";
              href = `/watchdog/${item.update_id ?? item.id}`;
            } else if (item.event_type === "grant_published") {
              // Use title/summary from RPC if available, otherwise show minimal fallback
              title = item.title ?? "New funding opportunity";
              href = item.update_id ? `/funding/${item.update_id}` : null;
            } else if (item.event_type === "follow") {
              if (item.person_profile_id) {
                title = `${actorName} followed ${getProfileName(targetPerson)}`;
                href = `/people/${item.person_profile_id}`;
              } else if (item.org_id) {
                title = `${actorName} followed ${organisation?.name ?? "an organisation"}`;
                href = `/organisations/${item.org_id}`;
              } else if (item.project_id) {
                title = `${actorName} followed ${project?.name ?? "a project"}`;
                href = `/projects/${project?.slug ?? item.project_id}`;
              }
            }

            return (
              <FeedItemCard
                key={item.id}
                title={title}
                summary={item.summary}
                href={href}
                timestamp={item.created_at}
                actorAvatarUrl={actor?.avatar_url}
                actorName={actorName}
                eventType={item.event_type}
              />
            );
          })}

          {hasMore && nextCursor ? (
            <div className="pt-2">
              <Link
                href={`/feed?${nextParams.toString()}`}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-soltas-bark hover:bg-slate-50"
              >
                Load more
              </Link>
            </div>
          ) : null}
        </section>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-soltas-muted">
          {activeTab === "popular" && "No activity yet"}
          {activeTab === "following" && "Follow projects, organisations, or people to personalize your feed"}
          {activeTab === "watchdog" && "No verified watchdog items yet"}
          {activeTab === "funding" && "No new funding opportunities posted yet"}
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-soltas-muted">
            Discover people
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-soltas-text">
            {(discoverPeople ?? []).map((person) => (
              <li key={person.id} className="flex items-center gap-3">
                {person.avatar_url ? (
                  <img
                    src={person.avatar_url}
                    alt={getProfileName(person)}
                    className="h-8 w-8 rounded-full border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50 text-xs text-soltas-muted">
                    —
                  </div>
                )}
                <Link href={`/people/${person.id}`} className="hover:underline">
                  {getProfileName(person)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-soltas-muted">
            Discover organisations
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-soltas-text">
            {(discoverOrgs ?? []).map((org) => (
              <li key={org.id}>
                <Link href={`/organisations/${org.id}`} className="hover:underline">
                  {org.name ?? "Unnamed organisation"}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-soltas-muted">
            Discover projects
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-soltas-text">
            {(discoverProjects ?? []).map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.slug ?? project.id}`}
                  className="hover:underline"
                >
                  {project.name ?? "Untitled project"}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
