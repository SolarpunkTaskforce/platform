import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { ensureSupabaseConfig } from "@/lib/supabaseConfig";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const { url, anonKey } = ensureSupabaseConfig();
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if there's pending organisation data
      // Note: We can't directly access localStorage from server, so we redirect to onboarding
      // The onboarding page will check localStorage client-side
      return NextResponse.redirect(`${origin}/onboarding/organisation`);
    }
  }

  // If no code or error, redirect to next or home
  return NextResponse.redirect(`${origin}${next}`);
}
