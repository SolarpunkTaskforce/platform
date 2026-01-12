import { redirect } from "next/navigation";

import { getServerSupabase } from "@/lib/supabaseServer";

export default async function MyProfileRedirectPage() {
  const supabase = await getServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not signed in, send to auth entry point.
  if (!user) redirect("/auth");

  // If you ever create separate organisation accounts later, we can branch here.
  // For Phase 1/2, user profiles live at /people/[id].
  redirect(`/people/${user.id}`);
}
