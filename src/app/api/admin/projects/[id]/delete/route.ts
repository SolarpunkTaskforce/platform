import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabaseServer";

function errorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err && typeof (err as any).message === "string") {
    return (err as any).message;
  }
  return "Unknown error";
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await getServerSupabase();
  const { id } = await context.params;

  // Only admins/superadmins
  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
  if (adminError || !isAdmin) {
    return NextResponse.redirect(new URL("/admin/registrations?error=Not+authorized", request.url));
  }

  const formData = await request.formData();
  const category = String(formData.get("category") ?? "environmental");
  const view = String(formData.get("view") ?? "pending");

  const redirectUrl = new URL("/admin/registrations", request.url);
  redirectUrl.searchParams.set("category", category);
  redirectUrl.searchParams.set("view", view);

  // Delete related rows first (best-effort).
  // Each call is awaited individually: simpler + type-safe.
  const childDeletes = [
    supabase.from("project_links").delete().eq("project_id", id),
    supabase.from("project_media").delete().eq("project_id", id),
    supabase.from("project_partners").delete().eq("project_id", id),
    supabase.from("project_sdgs").delete().eq("project_id", id),
    supabase.from("project_ifrc_challenges").delete().eq("project_id", id),
    // project_shares may not exist in every environment; try it, but don't fail hard if table is missing.
    supabase.from("project_shares").delete().eq("project_id", id),
  ];

  for (const op of childDeletes) {
    const res = await op;

    // If the table doesn't exist, Supabase returns an error; ignore only for project_shares.
    if (res.error) {
      const msg = errorMessage(res.error);

      const isMissingSharesTable =
        msg.toLowerCase().includes("project_shares") && msg.toLowerCase().includes("does not exist");

      if (isMissingSharesTable) continue;

      redirectUrl.searchParams.set("error", `Failed to delete related records: ${msg}`);
      return NextResponse.redirect(redirectUrl);
    }
  }

  const { error: deleteError } = await supabase.from("projects").delete().eq("id", id);

  if (deleteError) {
    redirectUrl.searchParams.set("error", `Failed to delete project: ${errorMessage(deleteError)}`);
    return NextResponse.redirect(redirectUrl);
  }

  redirectUrl.searchParams.set("message", "Project deleted successfully.");
  return NextResponse.redirect(redirectUrl);
}
