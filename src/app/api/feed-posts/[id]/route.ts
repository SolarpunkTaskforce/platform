import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabaseServer";

const updateFeedPostSchema = z.object({
  content: z.string().min(1, "Content is required").max(5000, "Content is too long"),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getServerSupabase();

    // Check authentication
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const parsed = updateFeedPostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const { content } = parsed.data;

    // Fetch the existing post to check if it exists
    const { data: existingPost, error: fetchError } = await supabase
      .from("feed_posts")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Update the feed post (RLS will enforce permissions)
    const { data: post, error: updateError } = await supabase
      .from("feed_posts")
      .update({ content })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      // Handle RLS errors more gracefully
      if (updateError.code === "42501" || updateError.message.includes("policy")) {
        return NextResponse.json(
          { error: "You do not have permission to edit this post" },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: updateError.message || "Failed to update post" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, post }, { status: 200 });
  } catch (error) {
    console.error("Error updating feed post:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getServerSupabase();

    // Check authentication
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the existing post to check if it exists
    const { data: existingPost, error: fetchError } = await supabase
      .from("feed_posts")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Delete the feed post (RLS will enforce permissions)
    const { error: deleteError } = await supabase
      .from("feed_posts")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      // Handle RLS errors more gracefully
      if (deleteError.code === "42501" || deleteError.message.includes("policy")) {
        return NextResponse.json(
          { error: "You do not have permission to delete this post" },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: deleteError.message || "Failed to delete post" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting feed post:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
