import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabaseServer";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const supabase = await getServerSupabase();

    // Check authentication
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the post exists and user has permission
    const { data: post, error: postError } = await supabase
      .from("feed_posts")
      .select("id, created_by, author_organisation_id")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if user owns the post
    if (post.created_by !== auth.user.id) {
      return NextResponse.json(
        { error: "You do not have permission to add attachments to this post" },
        { status: 403 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Generate unique file path: userId/postId/timestamp-filename
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop();
    const filePath = `${auth.user.id}/${postId}/${timestamp}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("feed-posts")
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: uploadError.message || "Failed to upload file" },
        { status: 500 }
      );
    }

    // Create attachment record in database
    const { data: attachment, error: attachmentError } = await supabase
      .from("feed_post_attachments")
      .insert({
        post_id: postId,
        file_path: uploadData.path,
        mime_type: file.type,
        file_size: file.size,
      })
      .select()
      .single();

    if (attachmentError) {
      console.error("Attachment record error:", attachmentError);
      // Clean up uploaded file if database insert fails
      await supabase.storage.from("feed-posts").remove([uploadData.path]);
      return NextResponse.json(
        { error: attachmentError.message || "Failed to create attachment record" },
        { status: 500 }
      );
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from("feed-posts")
      .getPublicUrl(uploadData.path);

    return NextResponse.json(
      {
        success: true,
        attachment: {
          ...attachment,
          url: urlData.publicUrl,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading attachment:", error);
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
    const { id: postId } = await params;
    const supabase = await getServerSupabase();

    // Check authentication
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get attachment ID from search params
    const url = new URL(request.url);
    const attachmentId = url.searchParams.get("attachmentId");

    if (!attachmentId) {
      return NextResponse.json({ error: "Attachment ID is required" }, { status: 400 });
    }

    // Get attachment with post details
    const { data: attachment, error: fetchError } = await supabase
      .from("feed_post_attachments")
      .select("id, post_id, file_path, feed_posts!inner(created_by)")
      .eq("id", attachmentId)
      .eq("post_id", postId)
      .single();

    if (fetchError || !attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    // Type assertion for the joined data
    const feedPost = attachment.feed_posts as unknown as { created_by: string };

    // Check if user owns the post
    if (feedPost.created_by !== auth.user.id) {
      return NextResponse.json(
        { error: "You do not have permission to delete this attachment" },
        { status: 403 }
      );
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("feed-posts")
      .remove([attachment.file_path]);

    if (storageError) {
      console.error("Storage deletion error:", storageError);
      // Continue with database deletion even if storage fails
    }

    // Delete from database (RLS will enforce permissions)
    const { error: deleteError } = await supabase
      .from("feed_post_attachments")
      .delete()
      .eq("id", attachmentId);

    if (deleteError) {
      console.error("Database deletion error:", deleteError);
      return NextResponse.json(
        { error: deleteError.message || "Failed to delete attachment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
