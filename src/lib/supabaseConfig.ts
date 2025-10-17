export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

export class MissingSupabaseEnvError extends Error {
  constructor() {
    super(
      "Supabase environment variables are not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable data access."
    );
    this.name = "MissingSupabaseEnvError";
  }
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function ensureSupabaseConfig(): SupabaseConfig {
  const config = getSupabaseConfig();
  if (!config) {
    throw new MissingSupabaseEnvError();
  }
  return config;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}
