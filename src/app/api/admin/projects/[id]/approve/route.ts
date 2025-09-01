import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabaseServer";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const supabase = getServerSupabase();
  const { data: ok } = await supabase.rpc("is_admin");
  if (!ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { data, error } = await supabase
    .from("projects")
    .update({ approval_status: "approved" })
    .eq("id", params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
