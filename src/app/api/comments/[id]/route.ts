import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabaseServer";

/**
 * DELETE /api/comments/:id
 * Delete a comment (own comments only, or admin)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: commentId } = await context.params;

  if (!commentId || typeof commentId !== "string") {
    return NextResponse.json({ error: "Invalid comment ID" }, { status: 400 });
  }

  const supabase = await getServerSupabase();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // RLS policies handle authorization (users can only delete their own comments, or admins can delete any)
  const { error: deleteError } = await supabase
    .from("update_comments")
    .delete()
    .eq("id", commentId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
