"use client";
import { createBrowserClient } from "@supabase/ssr";

import { ensureSupabaseConfig } from "./supabaseConfig";

export function supabaseClient() {
  const { url, anonKey } = ensureSupabaseConfig();
  return createBrowserClient(url, anonKey);
}
