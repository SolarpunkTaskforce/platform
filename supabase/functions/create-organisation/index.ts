import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set([
  "https://www.solarpunktaskforce.org",
  "https://solarpunktaskforce.org",
  "http://localhost:3000",
  "http://localhost:5173",
]);

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://www.solarpunktaskforce.org";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "OPTIONS, POST",
    "Access-Control-Max-Age": "86400",
  };
}

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
  const headers = corsHeaders(req);

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed. Use POST." }), {
        status: 405,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // Use anon client + JWT to get user id
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    let orgData: OrganisationData;
    try {
      orgData = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    if (!orgData.name || !orgData.country_based || !orgData.what_we_do) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name, country_based, what_we_do" }),
        { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    // Idempotency: if user already admin of an org, return it
    const { data: existingMembership, error: membershipCheckError } =
      await serviceClient
        .from("organisation_members")
        .select("organisation_id")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

    if (membershipCheckError) {
      console.error("Error checking existing membership:", membershipCheckError);
      return new Response(JSON.stringify({ error: "Failed to check existing organisation" }), {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    if (existingMembership) {
      return new Response(JSON.stringify({ organisation_id: existingMembership.organisation_id }), {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

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
        created_by: user.id,
        verification_status: "pending",
      })
      .select("id, name")
      .single();

    if (orgError || !newOrg) {
      console.error("Error creating organisation:", orgError);
      return new Response(JSON.stringify({ error: "Failed to create organisation" }), {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const { error: memberError } = await serviceClient
      .from("organisation_members")
      .insert({
        organisation_id: newOrg.id,
        user_id: user.id,
        role: "admin",
        can_create_projects: true,
        can_create_funding: true,
        can_post_feed: true,
        can_create_issues: true,
        can_manage_members: true,
      });

    if (memberError) {
      console.error("Error creating membership:", memberError);
      await serviceClient.from("organisations").delete().eq("id", newOrg.id);
      return new Response(JSON.stringify({ error: "Failed to create organisation membership" }), {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    await serviceClient
      .from("profiles")
      .update({
        kind: "organisation",
        organisation_id: newOrg.id,
        organisation_name: newOrg.name,
        role: "admin",
      })
      .eq("id", user.id);

    // Clear pending_org metadata (best-effort)
    try {
      const currentMetadata = user.user_metadata || {};
      const { pending_org, ...restMetadata } = currentMetadata;
      await serviceClient.auth.admin.updateUserById(user.id, { user_metadata: restMetadata });
    } catch (e) {
      console.error("Metadata cleanup error (non-fatal):", e);
    }

    return new Response(JSON.stringify({ organisation_id: newOrg.id }), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
});
