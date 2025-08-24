"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AuthButton() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!userEmail) {
    return (
      <Link href="/auth" className="rounded-xl border px-3 py-1 text-sm">
        Sign in
      </Link>
    );
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/dashboard" className="rounded-xl border px-3 py-1 text-sm">Dashboard</Link>
      <button onClick={signOut} className="rounded-xl border px-3 py-1 text-sm">Sign out</button>
    </div>
  );
}
