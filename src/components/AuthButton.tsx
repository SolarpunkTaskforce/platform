"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabaseClient";

const supabase = supabaseClient();

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
      <div className="flex items-center gap-3">
        <Link href="/login" className="rounded-full border border-soltas-glacial px-4 py-2 text-sm text-soltas-ocean hover:bg-soltas-light transition-all duration-200">
          Sign in
        </Link>
        <Link href="/signup" className="rounded-full bg-soltas-ocean px-4 py-2 text-sm text-white hover:bg-soltas-abyssal transition-all duration-200">
          Register
        </Link>
      </div>
    );
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/dashboard" className="rounded-full border border-soltas-glacial px-4 py-2 text-sm text-soltas-ocean hover:bg-soltas-light transition-all duration-200">Dashboard</Link>
      <button onClick={signOut} className="rounded-full bg-soltas-ocean px-4 py-2 text-sm text-white hover:bg-soltas-abyssal transition-all duration-200">Sign out</button>
    </div>
  );
}
