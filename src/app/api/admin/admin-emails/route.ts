import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const supabase = await getServerSupabase();
  const { data: isSuper } = await supabase.rpc("is_superadmin");
  if (!isSuper) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const form = await req.formData();
  const op = String(form.get("op") || "");
  const email = String(form.get("email") || "").toLowerCase();

  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  if (op === "add") {
    const { error } = await supabase.from("admin_emails").insert({ email });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (op === "remove") {
    // prevent deleting last admin is enforced by trigger
    const { error } = await supabase.from("admin_emails").delete().eq("email", email);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "invalid op" }, { status: 400 });
}
