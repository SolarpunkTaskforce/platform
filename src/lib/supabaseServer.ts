import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { ensureSupabaseConfig } from "./supabaseConfig";

/**
 * Server-side Supabase client.
 *
 * Important: Next.js Server Components may throw if you try to mutate cookies during render.
 * Supabase may attempt to set/remove cookies (refresh session) when calling auth methods.
 *
 * So: we make cookie writes "best-effort" — allowed in Route Handlers/Server Actions,
 * but ignored (instead of crashing) in Server Components.
 */
export async function getServerSupabase() {
  const cookieStore = await cookies();
  const { url, anonKey } = ensureSupabaseConfig();

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server Components may not allow cookie mutation during render.
          // Ignore to prevent SSR crash; session refresh can still happen elsewhere.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Same rationale as set()
        }
      },
    },
  });
}
