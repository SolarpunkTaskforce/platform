import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await supabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { error: updErr } = await supabase
    .from("projects")
    .update({ status: "approved", approved_by: user.id, approved_at: new Date().toISOString() })
    .eq("id", params.id);

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
