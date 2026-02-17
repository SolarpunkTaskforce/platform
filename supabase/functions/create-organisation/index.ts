import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// CORS headers for preflight requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrganisationData {
  name: string;
  country_based: string;
  what_we_do: string;
  existing_since?: string;
  website?: string;
  logo_url?: string;
  social_links?: Array<{ type: string; url: string }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate request method
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed. Use POST." }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Validate Authorization header exists
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey || !supabaseAnonKey) {
      console.error("Missing environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Use anon client + JWT to get user id
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await anonClient.auth.getUser();

    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Parse request body
    let orgData: OrganisationData;
    try {
      orgData = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Validate required fields
    if (!orgData.name || !orgData.country_based || !orgData.what_we_do) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: name, country_based, what_we_do"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Use service role client for DB writes
    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Check if user already owns an org (idempotency)
    const { data: existingMembership, error: membershipCheckError } =
      await serviceClient
        .from("organisation_members")
        .select("organisation_id")
        .eq("user_id", user.id)
        .eq("role", "owner")
        .maybeSingle();

    if (membershipCheckError) {
      console.error("Error checking existing membership:", membershipCheckError);
      return new Response(
        JSON.stringify({ error: "Failed to check existing organisation" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // If user already owns an org, return it (idempotent)
    if (existingMembership) {
      return new Response(
        JSON.stringify({ organisation_id: existingMembership.organisation_id }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Create organisation - Force created_by = user.id and verification_status='pending'
    const { data: newOrg, error: orgError } = await serviceClient
      .from("organisations")
      .insert({
        name: orgData.name,
        country_based: orgData.country_based,
        what_we_do: orgData.what_we_do,
        existing_since: orgData.existing_since || null,
        website: orgData.website || null,
        logo_url: orgData.logo_url || null,
        social_links: orgData.social_links || [],
        created_by: user.id, // Force user.id
        verification_status: "pending", // Force pending
      })
      .select("id, name")
      .single();

    if (orgError || !newOrg) {
      console.error("Error creating organisation:", orgError);
      return new Response(
        JSON.stringify({ error: "Failed to create organisation" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Insert membership with role='owner'
    const { error: memberError } = await serviceClient
      .from("organisation_members")
      .insert({
        organisation_id: newOrg.id,
        user_id: user.id,
        role: "owner",
      });

    if (memberError) {
      console.error("Error creating membership:", memberError);
      // Rollback: delete the organisation
      await serviceClient.from("organisations").delete().eq("id", newOrg.id);
      return new Response(
        JSON.stringify({ error: "Failed to create organisation membership" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Update profile: kind='organisation', organisation_id, organisation_name, role='owner'
    const { error: profileError } = await serviceClient
      .from("profiles")
      .update({
        kind: "organisation",
        organisation_id: newOrg.id,
        organisation_name: newOrg.name,
        role: "owner",
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      // Note: We don't rollback here as the org and membership were created successfully
      // The profile update is a "nice to have" that can be fixed manually
    }

    // Clear user_metadata.pending_org using Auth Admin API
    try {
      const currentMetadata = user.user_metadata || {};
      const { pending_org, ...restMetadata } = currentMetadata;

      const { error: metadataError } = await serviceClient.auth.admin.updateUserById(
        user.id,
        { user_metadata: restMetadata }
      );

      if (metadataError) {
        console.error("Error clearing pending_org metadata:", metadataError);
        // Non-critical error, don't fail the request
      }
    } catch (metaErr) {
      console.error("Error processing metadata:", metaErr);
      // Non-critical error, don't fail the request
    }

    // Return success with organisation_id
    return new Response(
      JSON.stringify({ organisation_id: newOrg.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
