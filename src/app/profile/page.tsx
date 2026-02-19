import { redirect } from "next/navigation";

import { getServerSupabase } from "@/lib/supabaseServer";

export default async function MyProfileRedirectPage() {
  const supabase = await getServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not signed in, send to auth entry point.
  if (!user) redirect("/auth");

  // Check if user has an organisation profile context
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, kind, organisation_id")
    .eq("id", user.id)
    .maybeSingle();

  // If user has an organisation context and is an organisation profile, redirect to org
  if (profile?.kind === "organisation" && profile?.organisation_id) {
    redirect(`/organisations/${profile.organisation_id}`);
  }

  // Otherwise redirect to personal profile at /people/[id]
  redirect(`/people/${user.id}`);
}
