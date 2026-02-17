import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerSupabase } from "@/lib/supabaseServer";

export default async function MyOrganisationsPage() {
  const supabase = await getServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not signed in, redirect to login
  if (!user) redirect("/login");

  // Fetch user's organisation memberships
  const { data: orgMembers } = await supabase
    .from("organisation_members")
    .select("organisation_id, role, can_create_projects, can_create_funding, organisations(id, name, logo_url, verification_status, country_based)")
    .eq("user_id", user.id)
    .order("role", { ascending: true }); // owner, admin, member order

  const organisations = (orgMembers ?? [])
    .map((member) => {
      const org = Array.isArray(member.organisations)
        ? member.organisations[0]
        : member.organisations;
      if (org?.id && org?.name) {
        return {
          id: org.id,
          name: org.name,
          logo_url: org.logo_url,
          verification_status: org.verification_status,
          country_based: org.country_based,
          role: member.role ?? "member",
          can_create_projects: member.can_create_projects,
          can_create_funding: member.can_create_funding,
        };
      }
      return null;
    })
    .filter((org): org is NonNullable<typeof org> => org !== null);

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-soltas-bark">My organisations</h1>
        <p className="text-sm text-soltas-muted">
          Organisations you are a member of.
        </p>
      </div>

      {organisations.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="mb-4 text-sm text-soltas-muted">
            You are not a member of any organisations yet.
          </p>
          <Link
            href="/onboarding/organisation"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Create organisation
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {organisations.map((org) => (
            <Link
              key={org.id}
              href={`/organisations/${org.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow"
            >
              <div className="flex items-start gap-4">
                {org.logo_url ? (
                  <img
                    src={org.logo_url}
                    alt={org.name}
                    className="h-14 w-14 rounded-lg border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-soltas-muted">
                    —
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-lg font-semibold text-soltas-bark">
                      {org.name}
                    </h2>
                    {org.verification_status === "verified" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        <span aria-hidden>✓</span> Verified
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-soltas-muted">
                    <span className="capitalize">{org.role}</span>
                    {org.country_based && (
                      <span>Based in {org.country_based}</span>
                    )}
                  </div>
                  {(org.can_create_projects || org.can_create_funding) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {org.can_create_projects && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                          Can create projects
                        </span>
                      )}
                      {org.can_create_funding && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                          Can create funding
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="mb-4 text-sm text-soltas-muted">
              Want to start a new organisation?
            </p>
            <Link
              href="/onboarding/organisation"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Create organisation
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
