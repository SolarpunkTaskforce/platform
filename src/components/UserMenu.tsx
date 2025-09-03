"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { isAdmin as rpcIsAdmin, isSuperadmin as rpcIsSuper } from "@/lib/admin";

export default function UserMenu({ onNavigate }: { onNavigate?: () => void }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuper, setIsSuper] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || !mounted) return;
      const [a, s] = await Promise.all([
        rpcIsAdmin(supabase),
        rpcIsSuper(supabase),
      ]);
      if (!mounted) return;
      setIsAdmin(a);
      setIsSuper(s);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <Link
        href="/profile"
        className="px-4 py-2 hover:bg-white/10"
        onClick={onNavigate}
      >
        Profile
      </Link>
      <Link
        href="/settings"
        className="px-4 py-2 hover:bg-white/10"
        onClick={onNavigate}
      >
        Settings
      </Link>
      {isAdmin && (
        <Link
          href="/admin/registrations"
          className="px-4 py-2 hover:bg-white/10"
          onClick={onNavigate}
        >
          Project Registrations
        </Link>
      )}
      {isSuper && (
        <Link
          href="/admin/manage"
          className="px-4 py-2 hover:bg-white/10"
          onClick={onNavigate}
        >
          Manage Admins
        </Link>
      )}
      <button
        onClick={() => {
          supabase.auth.signOut();
          onNavigate?.();
        }}
        className="px-4 py-2 text-left hover:bg-white/10"
      >
        Sign out
      </button>
    </>
  );
}
