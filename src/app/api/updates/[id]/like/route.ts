import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabaseServer";

/**
 * POST /api/updates/:id/like
 * Like an update
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: updateId } = await context.params;

  if (!updateId || typeof updateId !== "string") {
    return NextResponse.json({ error: "Invalid update ID" }, { status: 400 });
  }

  const supabase = await getServerSupabase();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // Insert like (unique constraint will prevent duplicates)
  const { error: insertError } = await supabase
    .from("update_likes")
    .insert({
      update_id: updateId,
      user_id: user.id,
    });

  if (insertError) {
    // If duplicate, return success (idempotent)
    if (insertError.code === "23505") {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/updates/:id/like
 * Unlike an update
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: updateId } = await context.params;

  if (!updateId || typeof updateId !== "string") {
    return NextResponse.json({ error: "Invalid update ID" }, { status: 400 });
  }

  const supabase = await getServerSupabase();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { error: deleteError } = await supabase
    .from("update_likes")
    .delete()
    .eq("update_id", updateId)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
