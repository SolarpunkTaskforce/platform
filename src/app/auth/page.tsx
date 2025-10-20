"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { MissingSupabaseEnvError } from "@/lib/supabaseConfig";
import { supabaseClient } from "@/lib/supabaseClient";

let supabaseInitializationError: MissingSupabaseEnvError | null = null;
let supabase: ReturnType<typeof supabaseClient> | null = null;

try {
  supabase = supabaseClient();
} catch (error) {
  if (error instanceof MissingSupabaseEnvError) {
    supabaseInitializationError = error;
    supabase = null;
  } else {
    throw error;
  }
}

export default function AuthPage() {
  if (!supabase) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-sm text-slate-600">
            {supabaseInitializationError?.message}
          </p>
        </div>
        <p className="text-sm text-slate-600">
          Update <code>.env.local</code> with the Supabase project&apos;s URL and anon key,
          restart the development server, then reload this page to continue.
        </p>
      </div>
    );
  }

  return <AuthPageContent client={supabase} />;
}

type SupabaseClient = NonNullable<ReturnType<typeof supabaseClient>>;

function AuthPageContent({ client }: { client: SupabaseClient }) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin"|"signup">("signin");
  const [account, setAccount] = useState<"individual"|"organisation">("individual");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setErrorMsg(null);

    try {
      if (mode === "signin") {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) {
          setErrorMsg(error.message);
          return;
        }
        if (data.session) {
          router.replace("/");
          router.refresh();
        }
        return;
      }

      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: siteUrl ? `${siteUrl}/auth` : undefined,
          data: { kind: account },
        },
      });
      if (error) throw error;

      // If org, provision org + membership + profile flag
      if (account === "organisation" && orgName && data.user?.id) {
        const userId = data.user.id;
        const { data: org, error: orgErr } = await client
          .from("organisations")
          .insert({ name: orgName, created_by: userId })
          .select("id")
          .single();
        if (orgErr) throw orgErr;

        await client.from("organisation_members").insert({
          organisation_id: org.id,
          user_id: userId,
          role: "owner",
        });

        await client.from("profiles").update({
          kind: "organisation",
          organisation_name: orgName,
          organisation_id: org.id,
        }).eq("id", userId);
      }

      // If email confirmation is OFF or session is present, redirect now
      const { data: sess } = await client.auth.getSession();
      if (sess.session) {
        router.replace("/"); router.refresh();
      } else {
        setMsg("Check your email to confirm the account, then sign in.");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-2xl font-semibold">{mode === "signin" ? "Sign in" : "Create account"}</h1>

      <div className="mb-4 flex gap-2">
        <button
          className={`rounded-xl border px-3 py-1 text-sm ${mode==="signin" ? "font-semibold" : ""}`}
          onClick={() => setMode("signin")}
        >
          Sign in
        </button>
        <button
          className={`rounded-xl border px-3 py-1 text-sm ${mode==="signup" ? "font-semibold" : ""}`}
          onClick={() => setMode("signup")}
        >
          Sign up
        </button>
      </div>

      {mode === "signup" && (
        <div className="mb-4 flex gap-2">
          <button
            className={`rounded-xl border px-3 py-1 text-sm ${account==="individual" ? "font-semibold" : ""}`}
            onClick={() => setAccount("individual")}
          >
            Individual
          </button>
          <button
            className={`rounded-xl border px-3 py-1 text-sm ${account==="organisation" ? "font-semibold" : ""}`}
            onClick={() => setAccount("organisation")}
          >
            Organisation
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          className="w-full rounded-xl border px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full rounded-xl border px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {mode === "signup" && account === "organisation" && (
          <input
            type="text"
            placeholder="Organisation name"
            className="w-full rounded-xl border px-3 py-2"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
          />
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl border px-3 py-2"
        >
          {loading ? "..." : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      {errorMsg && <p className="mt-3 text-sm font-semibold text-red-600">{errorMsg}</p>}
      {msg && <p className="mt-3 text-sm">{msg}</p>}
    </div>
  );
}

