"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin"|"signup">("signin");
  const [account, setAccount] = useState<"individual"|"organisation">("individual");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMsg("Signed in.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: siteUrl ? `${siteUrl}/auth` : undefined,
          data: { kind: account },
        },
      });
      if (error) throw error;

      if (account === "organisation" && orgName) {
        const userId = data.user?.id;
        if (userId) {
          const { data: org, error: orgErr } = await supabase
            .from("organisations")
            .insert({ name: orgName, created_by: userId })
            .select("id")
            .single();
          if (orgErr) throw orgErr;

          await supabase.from("organisation_members").insert({
            organisation_id: org.id,
            user_id: userId,
            role: "owner",
          });

          await supabase.from("profiles").update({
            kind: "organisation",
            organisation_name: orgName,
            organisation_id: org.id,
          }).eq("id", userId);
        }
      }

      setMsg("Check your email to confirm the account if required.");
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-2xl font-semibold">{mode === "signin" ? "Sign in" : "Create account"}</h1>

      <div className="mb-4 flex gap-2">
        <button onClick={() => setMode("signin")} className={`rounded-xl border px-3 py-1 text-sm ${mode==="signin" ? "font-semibold" : ""}`}>Sign in</button>
        <button onClick={() => setMode("signup")} className={`rounded-xl border px-3 py-1 text-sm ${mode==="signup" ? "font-semibold" : ""}`}>Sign up</button>
      </div>

      {mode === "signup" && (
        <div className="mb-4 flex gap-2">
          <button onClick={() => setAccount("individual")} className={`rounded-xl border px-3 py-1 text-sm ${account==="individual" ? "font-semibold" : ""}`}>Individual</button>
          <button onClick={() => setAccount("organisation")} className={`rounded-xl border px-3 py-1 text-sm ${account==="organisation" ? "font-semibold" : ""}`}>Organisation</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="email" placeholder="Email" className="w-full rounded-xl border px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" className="w-full rounded-xl border px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {mode === "signup" && account === "organisation" && (
          <input type="text" placeholder="Organisation name" className="w-full rounded-xl border px-3 py-2" value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
        )}
        <button type="submit" disabled={loading} className="w-full rounded-xl border px-3 py-2">
          {loading ? "..." : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      {msg && <p className="mt-3 text-sm">{msg}</p>}
    </div>
  );
}
