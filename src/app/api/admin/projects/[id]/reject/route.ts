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

const normalizeCategory = (value: string | null) => {
  if (value === "humanitarian" || value === "environmental") {
    return value;
  }
  return "environmental";
};

const normalizeView = (value: string | null) => {
  if (value === "pending" || value === "approved" || value === "rejected") {
    return value;
  }
  return "rejected";
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
  const rawCategory = form.get("category");
  const rawView = form.get("view");
  const category = normalizeCategory(typeof rawCategory === "string" ? rawCategory : null);
  const view = normalizeView(typeof rawView === "string" ? rawView : null);

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

  const redirectUrl = new URL("/admin/registrations", request.url);
  redirectUrl.searchParams.set("category", category);
  redirectUrl.searchParams.set("view", view);

  if (error) {
    redirectUrl.searchParams.set("error", formatErrorMessage(error));
    return NextResponse.redirect(redirectUrl);
  }

  redirectUrl.searchParams.set(
    "message",
    reason ? "Project rejected and reason recorded." : "Project rejected.",
  );
  return NextResponse.redirect(redirectUrl);
}
