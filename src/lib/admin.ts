import type { SupabaseClient } from "@supabase/supabase-js";

export async function isAdmin(client: SupabaseClient) {
  const { data } = await client.rpc("is_admin");
  return Boolean(data);
}
export async function isSuperadmin(client: SupabaseClient) {
  const { data } = await client.rpc("is_superadmin");
  return Boolean(data);
}
