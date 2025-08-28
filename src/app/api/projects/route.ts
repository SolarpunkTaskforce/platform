import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();
  const body = await req.json();
  const { title, description, lat, lng, org_name } = body ?? {};

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { error } = await supabase.from("projects").insert({
    title, description, lat, lng, org_name,
    created_by: user.id,
    status: "pending"
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, status: "pending" });
}
