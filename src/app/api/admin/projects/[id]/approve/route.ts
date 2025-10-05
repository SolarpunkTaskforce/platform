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

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await getServerSupabase();
  const { data: ok } = await supabase.rpc("is_admin");
  if (!ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;

  const { data, error } = await supabase
    .from("projects")
    .update({ status: "approved" })
    .eq("id", id)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: formatErrorMessage(error) }, { status: 400 });
  }
  return NextResponse.json({ data });
}
