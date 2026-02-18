"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase } from "@/lib/supabaseServer";

export async function submitMembershipRequest(formData: FormData) {
  const organisationId = formData.get("organisation_id");
  const message = formData.get("message");

  if (typeof organisationId !== "string" || !organisationId) {
    throw new Error("Missing organisation id.");
  }

  const supabase = await getServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from("organisation_members")
    .select("user_id")
    .eq("organisation_id", organisationId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (existingMember) {
    throw new Error("You are already a member of this organisation.");
  }

  // Check if there's already a pending request
  const { data: existingRequest } = await supabase
    .from("organisation_member_requests")
    .select("id, status")
    .eq("organisation_id", organisationId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (existingRequest) {
    if (existingRequest.status === "pending") {
      throw new Error("You already have a pending request for this organisation.");
    } else if (existingRequest.status === "rejected") {
      throw new Error("Your previous request was rejected. Please contact the organisation directly.");
    }
  }

  // Insert the request (RLS will enforce user_id = auth.uid() and status = 'pending')
  const { error } = await supabase
    .from("organisation_member_requests")
    .insert({
      organisation_id: organisationId,
      user_id: auth.user.id,
      message: typeof message === "string" && message ? message : null,
      status: "pending",
    });

  if (error) {
    if (error.code === "23505") {
      // Unique constraint violation
      throw new Error("You already have a request for this organisation.");
    }
    throw new Error(`Failed to submit request: ${error.message}`);
  }

  revalidatePath("/me/organisations");
}

export async function cancelMembershipRequest(formData: FormData) {
  const requestId = formData.get("request_id");

  if (typeof requestId !== "string" || !requestId) {
    throw new Error("Missing request id.");
  }

  const supabase = await getServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Delete the request (RLS will enforce user_id = auth.uid() and status = 'pending')
  const { error } = await supabase
    .from("organisation_member_requests")
    .delete()
    .eq("id", requestId)
    .eq("user_id", auth.user.id)
    .eq("status", "pending");

  if (error) {
    throw new Error(`Failed to cancel request: ${error.message}`);
  }

  revalidatePath("/me/organisations");
}
