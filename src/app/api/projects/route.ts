import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getServerSupabase } from "@/lib/supabaseServer";

const legacyPayloadSchema = z.object({
  category: z.enum(["humanitarian", "environmental"]),
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  lat: z.number(),
  lng: z.number(),
  org_name: z.string().trim().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await getServerSupabase();
  const body = await req.json().catch(() => null);

  const validation = legacyPayloadSchema.safeParse(body);
  if (!validation.success) {
    const categoryIssue = validation.error.issues.find(issue => issue.path[0] === "category");
    const message = categoryIssue
      ? "Project category must be either humanitarian or environmental."
      : "Invalid project payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { name, description, lat, lng, org_name, category } = validation.data;

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { error } = await supabase.from("projects").insert({
    name,
    description,
    lat,
    lng,
    org_name,
    category,
    created_by: user.id,
    status: "pending",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, status: "pending" });
}
