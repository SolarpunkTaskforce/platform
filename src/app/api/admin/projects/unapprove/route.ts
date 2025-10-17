import { NextResponse } from "next/server";
import { z } from "zod";

import type { Database } from "@/lib/database.types";
import { MissingSupabaseEnvError } from "@/lib/supabaseConfig";
import { getServerSupabase } from "@/lib/supabaseServer";

const payloadSchema = z.object({
  id: z.string().min(1, "Project id is required."),
});

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

type ProjectUpdate = Pick<
  ProjectRow,
  "id" | "status" | "approved_at" | "approved_by" | "rejected_at" | "rejected_by" | "rejection_reason"
>;

export async function POST(request: Request) {
  let supabase;

  try {
    supabase = await getServerSupabase();
  } catch (error) {
    if (error instanceof MissingSupabaseEnvError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    throw error;
  }
  const { data: isAdmin } = await supabase.rpc("is_admin");

  if (!isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let payload: z.infer<typeof payloadSchema>;

  try {
    const json = await request.json();
    payload = payloadSchema.parse(json);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues.map(issue => issue.message).join(" ") || "Invalid request.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("projects")
    .update({
      status: "pending",
      approved_by: null,
      approved_at: null,
      rejected_at: null,
      rejected_by: null,
      rejection_reason: null,
    })
    .eq("id", payload.id)
    .select(
      "id,status,approved_at,approved_by,rejected_at,rejected_by,rejection_reason"
    )
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    if (error.code === "42501") {
      return NextResponse.json({ error: "Not authorised." }, { status: 403 });
    }

    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data: data as ProjectUpdate });
}

