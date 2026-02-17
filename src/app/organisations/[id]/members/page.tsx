import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import Link from "next/link";

import { getServerSupabase } from "@/lib/supabaseServer";

type Member = {
  user_id: string;
  role: string;
  can_create_projects: boolean;
  can_create_funding: boolean;
  created_at: string | null;
  user_email?: string | null;
};

async function updateMemberRole(formData: FormData) {
  "use server";

  const organisationId = formData.get("organisation_id");
  const userId = formData.get("user_id");
  const role = formData.get("role");

  if (typeof organisationId !== "string" || !organisationId) {
    throw new Error("Missing organisation id.");
  }

  if (typeof userId !== "string" || !userId) {
    throw new Error("Missing user id.");
  }

  if (role !== "member" && role !== "admin") {
    throw new Error("Invalid role.");
  }

  const supabase = await getServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Check if the current user is an admin/owner of this org
  const { data: currentMember } = await supabase
    .from("organisation_members")
    .select("role")
    .eq("organisation_id", organisationId)
    .eq("user_id", auth.user.id)
    .single();

  if (!currentMember || (currentMember.role !== "admin" && currentMember.role !== "owner")) {
    throw new Error("Unauthorized");
  }

  // Update the role and set default permissions based on role
  const { error } = await supabase
    .from("organisation_members")
    .update({
      role,
      can_create_projects: role === "admin",
      can_create_funding: role === "admin",
    })
    .eq("organisation_id", organisationId)
    .eq("user_id", userId);

  if (error) throw error;

  revalidatePath(`/organisations/${organisationId}/members`);
}

async function updateMemberPermission(formData: FormData) {
  "use server";

  const organisationId = formData.get("organisation_id");
  const userId = formData.get("user_id");
  const permission = formData.get("permission");
  const value = formData.get("value") === "true";

  if (typeof organisationId !== "string" || !organisationId) {
    throw new Error("Missing organisation id.");
  }

  if (typeof userId !== "string" || !userId) {
    throw new Error("Missing user id.");
  }

  if (permission !== "can_create_projects" && permission !== "can_create_funding") {
    throw new Error("Invalid permission.");
  }

  const supabase = await getServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Check if the current user is an admin/owner of this org
  const { data: currentMember } = await supabase
    .from("organisation_members")
    .select("role")
    .eq("organisation_id", organisationId)
    .eq("user_id", auth.user.id)
    .single();

  if (!currentMember || (currentMember.role !== "admin" && currentMember.role !== "owner")) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("organisation_members")
    .update({ [permission]: value })
    .eq("organisation_id", organisationId)
    .eq("user_id", userId);

  if (error) throw error;

  revalidatePath(`/organisations/${organisationId}/members`);
}

async function removeMember(formData: FormData) {
  "use server";

  const organisationId = formData.get("organisation_id");
  const userId = formData.get("user_id");

  if (typeof organisationId !== "string" || !organisationId) {
    throw new Error("Missing organisation id.");
  }

  if (typeof userId !== "string" || !userId) {
    throw new Error("Missing user id.");
  }

  const supabase = await getServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Check if the current user is an admin/owner of this org
  const { data: currentMember } = await supabase
    .from("organisation_members")
    .select("role")
    .eq("organisation_id", organisationId)
    .eq("user_id", auth.user.id)
    .single();

  if (!currentMember || (currentMember.role !== "admin" && currentMember.role !== "owner")) {
    throw new Error("Unauthorized");
  }

  // Prevent removing owner
  const { data: targetMember } = await supabase
    .from("organisation_members")
    .select("role")
    .eq("organisation_id", organisationId)
    .eq("user_id", userId)
    .single();

  if (targetMember?.role === "owner") {
    throw new Error("Cannot remove the owner.");
  }

  const { error } = await supabase
    .from("organisation_members")
    .delete()
    .eq("organisation_id", organisationId)
    .eq("user_id", userId);

  if (error) throw error;

  revalidatePath(`/organisations/${organisationId}/members`);
}

async function addMember(formData: FormData) {
  "use server";

  const organisationId = formData.get("organisation_id");
  const email = formData.get("email");

  if (typeof organisationId !== "string" || !organisationId) {
    throw new Error("Missing organisation id.");
  }

  if (typeof email !== "string" || !email) {
    throw new Error("Missing email.");
  }

  const supabase = await getServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Check if the current user is an admin/owner of this org
  const { data: currentMember } = await supabase
    .from("organisation_members")
    .select("role")
    .eq("organisation_id", organisationId)
    .eq("user_id", auth.user.id)
    .single();

  if (!currentMember || (currentMember.role !== "admin" && currentMember.role !== "owner")) {
    throw new Error("Unauthorized");
  }

  // Look up user by email in auth.users (admin only)
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    throw new Error("Adding members by email requires admin privileges.");
  }

  // For now, we'll just return an error since we can't directly query auth.users
  // In production, this would need to be implemented with an RPC function
  throw new Error("Adding members is not yet implemented. Users must be added via invite links.");
}

export default async function OrganisationMembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id || typeof id !== "string") notFound();

  const supabase = await getServerSupabase();

  const { data: organisation, error: orgError } = await supabase
    .from("organisations")
    .select("id,name")
    .eq("id", id)
    .single();

  if (!organisation) {
    notFound();
  }

  if (orgError) {
    throw new Error("Unable to load organisation.");
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user?.id) {
    notFound();
  }

  // Check if the current user is an admin/owner of this org
  const { data: currentMember } = await supabase
    .from("organisation_members")
    .select("role")
    .eq("organisation_id", id)
    .eq("user_id", auth.user.id)
    .single();

  const isOrgAdmin = currentMember?.role === "admin" || currentMember?.role === "owner";

  if (!isOrgAdmin) {
    notFound();
  }

  // Fetch all members
  const { data: members, error: membersError } = await supabase
    .from("organisation_members")
    .select("user_id,role,can_create_projects,can_create_funding,created_at")
    .eq("organisation_id", id)
    .order("created_at", { ascending: true });

  if (membersError) {
    throw new Error("Unable to load members.");
  }

  const typedMembers = (members ?? []) as Member[];

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-5 pb-20 pt-12">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-[#1A2B38]">Manage members</h1>
          <p className="text-sm text-soltas-muted">
            Manage roles and permissions for{" "}
            <Link href={`/organisations/${id}`} className="font-medium text-soltas-ocean hover:underline">
              {organisation.name}
            </Link>
          </p>
        </div>
        <Link
          href={`/organisations/${id}`}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-soltas-bark hover:bg-slate-50"
        >
          Back to organisation
        </Link>
      </div>

      <div className="rounded-2xl border border-[#6B9FB8]/25 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-soltas-muted">
              <tr>
                <th className="px-6 py-3">User ID</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Can Create Projects</th>
                <th className="px-6 py-3">Can Create Funding</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {typedMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-soltas-muted">
                    No members found.
                  </td>
                </tr>
              ) : (
                typedMembers.map((member) => {
                  const isOwner = member.role === "owner";
                  const isCurrentUser = member.user_id === auth.user.id;

                  return (
                    <tr key={member.user_id}>
                      <td className="px-6 py-4">
                        <div className="text-xs text-soltas-muted">{member.user_id}</div>
                        {isCurrentUser && (
                          <span className="text-xs text-blue-600 font-medium">(You)</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isOwner ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                            Owner
                          </span>
                        ) : (
                          <form action={updateMemberRole} className="inline-block">
                            <input type="hidden" name="organisation_id" value={id} />
                            <input type="hidden" name="user_id" value={member.user_id} />
                            <select
                              name="role"
                              defaultValue={member.role}
                              onChange={(e) => e.currentTarget.form?.requestSubmit()}
                              className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-soltas-bark focus:border-[#6B9FB8] focus:outline-none focus:ring-2 focus:ring-[#6B9FB8]/60"
                            >
                              <option value="member">Member</option>
                              <option value="admin">Admin</option>
                            </select>
                          </form>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isOwner ? (
                          <span className="text-xs text-green-600">✓ Yes</span>
                        ) : (
                          <form action={updateMemberPermission} className="inline-block">
                            <input type="hidden" name="organisation_id" value={id} />
                            <input type="hidden" name="user_id" value={member.user_id} />
                            <input type="hidden" name="permission" value="can_create_projects" />
                            <input
                              type="checkbox"
                              name="value"
                              value="true"
                              defaultChecked={member.can_create_projects}
                              onChange={(e) => {
                                const form = e.currentTarget.form;
                                if (form) {
                                  const valueInput = form.querySelector('input[name="value"]') as HTMLInputElement;
                                  if (valueInput) {
                                    valueInput.value = e.currentTarget.checked.toString();
                                  }
                                  form.requestSubmit();
                                }
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-[#6B9FB8] focus:ring-[#6B9FB8]"
                            />
                          </form>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isOwner ? (
                          <span className="text-xs text-green-600">✓ Yes</span>
                        ) : (
                          <form action={updateMemberPermission} className="inline-block">
                            <input type="hidden" name="organisation_id" value={id} />
                            <input type="hidden" name="user_id" value={member.user_id} />
                            <input type="hidden" name="permission" value="can_create_funding" />
                            <input
                              type="checkbox"
                              name="value"
                              value="true"
                              defaultChecked={member.can_create_funding}
                              onChange={(e) => {
                                const form = e.currentTarget.form;
                                if (form) {
                                  const valueInput = form.querySelector('input[name="value"]') as HTMLInputElement;
                                  if (valueInput) {
                                    valueInput.value = e.currentTarget.checked.toString();
                                  }
                                  form.requestSubmit();
                                }
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-[#6B9FB8] focus:ring-[#6B9FB8]"
                            />
                          </form>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {!isOwner && !isCurrentUser ? (
                          <form action={removeMember} className="inline-block">
                            <input type="hidden" name="organisation_id" value={id} />
                            <input type="hidden" name="user_id" value={member.user_id} />
                            <button className="rounded border border-rose-500 px-3 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50">
                              Remove
                            </button>
                          </form>
                        ) : (
                          <span className="text-xs text-soltas-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
