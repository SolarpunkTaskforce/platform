import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { getServerSupabase } from "@/lib/supabaseServer";

export default async function MyOrganisationsPage() {
  const supabase = await getServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth");
  }

  // Query organisations via organisation_members join organisations
  const { data: memberships, error } = await supabase
    .from("organisation_members")
    .select(
      "role,can_create_projects,can_create_funding,organisations(id,name,verification_status,logo_url)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user organisations:", error);
    throw new Error(error.message ?? "Unable to load organisations.");
  }

  const orgs = (memberships ?? [])
    .map((membership) => {
      const org = Array.isArray(membership.organisations)
        ? membership.organisations[0]
        : membership.organisations;
      if (!org) return null;
      return {
        id: org.id,
        name: org.name,
        verification_status: org.verification_status,
        logo_url: org.logo_url,
        role: membership.role,
        can_create_projects: membership.can_create_projects,
        can_create_funding: membership.can_create_funding,
      };
    })
    .filter((org): org is NonNullable<typeof org> => org !== null);

  const hasNoOrgs = orgs.length === 0;

  function getVerificationBadge(status: string) {
    switch (status) {
      case "verified":
        return (
          <Badge variant="ocean" className="uppercase">
            Verified
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="uppercase">
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="uppercase">
            {status}
          </Badge>
        );
    }
  }

  function getRoleBadge(role: string) {
    const roleColors: Record<string, string> = {
      owner: "bg-purple-100 text-purple-700 border-purple-200",
      admin: "bg-blue-100 text-blue-700 border-blue-200",
      member: "bg-slate-100 text-slate-700 border-slate-200",
    };

    const colorClass = roleColors[role] ?? "bg-slate-100 text-slate-700 border-slate-200";

    return (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide ${colorClass}`}
      >
        {role}
      </span>
    );
  }

  function canEditOrg(role: string) {
    return role === "owner" || role === "admin";
  }

  function canManageMembers(role: string) {
    return role === "owner" || role === "admin";
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-soltas-bark">My Organisations</h1>
        <p className="text-sm text-soltas-muted">
          Manage your organisation memberships and access.
        </p>
      </div>

      {hasNoOrgs ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto max-w-md space-y-4">
            <h2 className="text-lg font-semibold text-soltas-bark">No organisations yet</h2>
            <p className="text-sm text-soltas-muted">
              Organisations are groups of people working together on projects. Create an
              organisation to start collaborating with your team and showcase your collective
              impact.
            </p>
            <Link
              href="/onboarding/organisation"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Create Organisation
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orgs.map((org) => (
            <div
              key={org.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  {org.logo_url ? (
                    <img
                      src={org.logo_url}
                      alt={org.name}
                      className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-soltas-muted">
                      —
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-soltas-bark">{org.name}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {getRoleBadge(org.role)}
                      {getVerificationBadge(org.verification_status)}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link
                    href={`/organisations/${org.id}`}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                  >
                    View
                  </Link>
                  {canEditOrg(org.role) ? (
                    <Link
                      href={`/organisations/${org.id}/edit`}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                    >
                      Edit
                    </Link>
                  ) : null}
                  {canManageMembers(org.role) ? (
                    <Link
                      href={`/organisations/${org.id}/members`}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                    >
                      Members
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
