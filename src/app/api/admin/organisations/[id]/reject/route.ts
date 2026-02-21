import { NextResponse } from "next/server";

import { getServerSupabase } from "@/lib/supabaseServer";

type IssueLike = { message?: string | undefined };

const formatErrorMessage = (error: unknown): string => {
  if (typeof error === "object" && error !== null) {
    const issues = (error as { issues?: IssueLike[] }).issues;
    if (Array.isArray(issues)) {
      const messages = issues
        .map(issue => issue?.message)
        .filter((message): message is string => Boolean(message && message.trim().length));
      if (messages.length > 0) {
        return messages.join(", ");
      }
    }

    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length) {
      return message;
    }
  }

  return "Unknown error";
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await getServerSupabase();
  const { data: ok } = await supabase.rpc("is_admin");
  if (!ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const form = await request.formData();
  const rawReason = form.get("reason");
  const reason = typeof rawReason === "string" && rawReason.trim().length ? rawReason.trim() : null;

  const { data: auth } = await supabase.auth.getUser();
  const rejectorId = auth?.user?.id ?? null;

  const { id } = await params;

  const { error } = await supabase
    .from("organisations")
    .update({
      verification_status: "rejected",
      rejected_at: new Date().toISOString(),
      rejected_by: rejectorId,
      rejection_reason: reason,
      verified_at: null,
      verified_by: null,
    })
    .eq("id", id);

  const redirectUrl = new URL("/admin/organisation-registrations", request.url);

  if (error) {
    redirectUrl.searchParams.set("error", formatErrorMessage(error));
    return NextResponse.redirect(redirectUrl);
  }

  redirectUrl.searchParams.set("message", "Organisation rejected successfully.");
  return NextResponse.redirect(redirectUrl);
}
