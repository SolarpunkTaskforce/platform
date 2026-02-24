import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabaseServer";

const updateFeedPostSchema = z.object({
  content: z.string().min(1, "Content is required").max(5000, "Content is too long"),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await getServerSupabase();

    // Check authentication
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

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
          { error: "You do not have permission to update this post" },
          { status: 403 }
        );
      }
      // Check for not found - when RLS blocks access, Supabase may return no rows
      if (updateError.code === "PGRST116" || !post) {
        return NextResponse.json(
          { error: "Post not found or you do not have permission to update it" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: updateError.message || "Failed to update post" },
        { status: 500 }
      );
    }

    if (!post) {
      return NextResponse.json(
        { error: "Post not found or you do not have permission to update it" },
        { status: 404 }
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

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await getServerSupabase();

    // Check authentication
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Delete the feed post (RLS will enforce permissions)
    const { data: post, error: deleteError } = await supabase
      .from("feed_posts")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (deleteError) {
      console.error("Delete error:", deleteError);
      // Handle RLS errors more gracefully
      if (deleteError.code === "42501" || deleteError.message.includes("policy")) {
        return NextResponse.json(
          { error: "You do not have permission to delete this post" },
          { status: 403 }
        );
      }
      // Check for not found
      if (deleteError.code === "PGRST116" || !post) {
        return NextResponse.json(
          { error: "Post not found or you do not have permission to delete it" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: deleteError.message || "Failed to delete post" },
        { status: 500 }
      );
    }

    if (!post) {
      return NextResponse.json(
        { error: "Post not found or you do not have permission to delete it" },
        { status: 404 }
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
