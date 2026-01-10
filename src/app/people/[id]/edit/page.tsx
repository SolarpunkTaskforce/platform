import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import SocialLinksEditor from "@/components/profiles/SocialLinksEditor";
import { normalizeSocialLinks } from "@/components/profiles/SocialLinks";
import { getServerSupabase } from "@/lib/supabaseServer";

function toOptionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseSocialLinks(formData: FormData, typeName: string, urlName: string) {
  const types = formData.getAll(typeName).map((entry) =>
    typeof entry === "string" ? entry.trim() : ""
  );
  const urls = formData.getAll(urlName).map((entry) =>
    typeof entry === "string" ? entry.trim() : ""
  );

  const links: { type?: string; url: string }[] = [];
  const maxLength = Math.max(types.length, urls.length);

  for (let i = 0; i < maxLength; i += 1) {
    const url = urls[i] ?? "";
    const type = types[i] ?? "";
    if (url.length === 0) continue;
    links.push({ url, type: type.length > 0 ? type : undefined });
  }

  return links;
}

async function updateProfile(formData: FormData) {
  "use server";

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    throw new Error("Missing profile id.");
  }

  const supabase = await getServerSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user?.id) {
    throw new Error("Unable to resolve user session.");
  }

  if (userData.user.id !== id) {
    throw new Error("Unauthorized");
  }

  const organisationValue = formData.get("organisation_id");
  let organisationId: string | null = null;

  if (typeof organisationValue === "string" && organisationValue !== "independent") {
    const { data: org } = await supabase
      .from("verified_organisations")
      .select("id")
      .eq("id", organisationValue)
      .maybeSingle();

    if (org?.id) {
      organisationId = org.id;
    }
  }

  const socialLinks = parseSocialLinks(formData, "social_type", "social_url");

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: toOptionalString(formData.get("first_name")),
      last_name: toOptionalString(formData.get("last_name")),
      country_from: toOptionalString(formData.get("country_from")),
      country_based: toOptionalString(formData.get("country_based")),
      occupation: toOptionalString(formData.get("occupation")),
      bio: toOptionalString(formData.get("bio")),
      avatar_url: toOptionalString(formData.get("avatar_url")),
      organisation_id: organisationId,
      social_links: socialLinks,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message ?? "Unable to update profile.");
  }

  revalidatePath(`/people/${id}`);
  revalidatePath(`/people/${id}/edit`);
  redirect(`/people/${id}`);
}

export default async function ProfileEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id || typeof id !== "string") notFound();

  const supabase = await getServerSupabase();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id,first_name,last_name,country_from,country_based,occupation,bio,avatar_url,social_links,organisation_id",
    )
    .eq("id", id)
    .single();

  if (!profile) {
    if (error) {
      throw new Error("Unable to load profile.");
    }
    notFound();
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user || auth.user.id !== profile.id) {
    notFound();
  }

  const { data: verifiedOrgs } = await supabase
    .from("verified_organisations")
    .select("id,name")
    .order("name");

  const verifiedOrgIds = new Set((verifiedOrgs ?? []).map((org) => org.id));
  const selectedOrgId =
    profile.organisation_id && verifiedOrgIds.has(profile.organisation_id)
      ? profile.organisation_id
      : "independent";

  const socialLinks = normalizeSocialLinks(profile.social_links);

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Edit profile</h1>
        <p className="text-sm text-slate-600">Update your public details.</p>
      </div>

      <form action={updateProfile} className="space-y-6">
        <input type="hidden" name="id" value={profile.id} />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Basic information
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              First name
              <input
                name="first_name"
                defaultValue={profile.first_name ?? ""}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Last name
              <input
                name="last_name"
                defaultValue={profile.last_name ?? ""}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Country from
              <input
                name="country_from"
                defaultValue={profile.country_from ?? ""}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Country based
              <input
                name="country_based"
                defaultValue={profile.country_based ?? ""}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Occupation
              <input
                name="occupation"
                defaultValue={profile.occupation ?? ""}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Avatar URL
              <input
                name="avatar_url"
                defaultValue={profile.avatar_url ?? ""}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Bio</h2>
          <textarea
            name="bio"
            defaultValue={profile.bio ?? ""}
            rows={5}
            className="mt-4 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Organisation
          </h2>
          <div className="mt-4 space-y-2">
            <select
              name="organisation_id"
              defaultValue={selectedOrgId}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
            >
              <option value="independent">Independent</option>
              {(verifiedOrgs ?? []).map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
            {profile.organisation_id && selectedOrgId === "independent" ? (
              <p className="text-xs text-amber-600">
                Your current organisation is not verified, so it cannot be selected.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Social links
          </h2>
          <div className="mt-4">
            <SocialLinksEditor initialLinks={socialLinks} />
          </div>
        </section>

        <div className="flex justify-end">
          <button className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Save changes
          </button>
        </div>
      </form>
    </main>
  );
}
