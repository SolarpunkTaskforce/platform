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

const buildRedirect = (request: Request) => {
  const referer = request.headers.get("referer");
  const url = new URL(referer ?? "/admin/registrations?view=rejected", request.url);
  url.searchParams.delete("message");
  url.searchParams.delete("error");
  return url;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await getServerSupabase();
  const { data: ok } = await supabase.rpc("is_admin");
  if (!ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const form = await request.formData();
  const reason = ((form.get("reason") as string) || "").trim() || null;

  const { data: auth } = await supabase.auth.getUser();
  const reviewerId = auth?.user?.id ?? null;

  const { id } = await params;

  const { error } = await supabase
    .from("projects")
    .update({
      status: "rejected",
      rejected_at: new Date().toISOString(),
      rejected_by: reviewerId,
      rejection_reason: reason,
      approved_at: null,
      approved_by: null,
    })
    .eq("id", id);

  const redirectUrl = buildRedirect(request);

  if (error) {
    redirectUrl.searchParams.set("error", formatErrorMessage(error));
    return NextResponse.redirect(redirectUrl);
  }

  redirectUrl.searchParams.set(
    "message",
    reason ? "Project rejected and reason recorded." : "Project rejected.",
  );
  redirectUrl.searchParams.set("view", "rejected");
  return NextResponse.redirect(redirectUrl);
}
