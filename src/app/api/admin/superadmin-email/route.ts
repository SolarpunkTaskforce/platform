import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const supabase = getServerSupabase();
  const { data: isSuper } = await supabase.rpc("is_superadmin");
  if (!isSuper) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const form = await req.formData();
  const email = String(form.get("email") || "").toLowerCase();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const { error } = await supabase
    .from("app_settings")
    .update({ superadmin_email: email })
    .eq("id", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
