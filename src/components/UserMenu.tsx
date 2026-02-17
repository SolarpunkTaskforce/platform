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
        className="rounded-lg px-3 py-2 text-[#1A2B38] hover:bg-[#EEF2F5] transition-colors duration-150"
        onClick={onNavigate}
      >
        Profile
      </Link>
      <Link
        href="/me/organisations"
        className="rounded-lg px-3 py-2 text-[#1A2B38] hover:bg-[#EEF2F5] transition-colors duration-150"
        onClick={onNavigate}
      >
        My Organisations
      </Link>
      <Link
        href="/settings"
        className="rounded-lg px-3 py-2 text-[#1A2B38] hover:bg-[#EEF2F5] transition-colors duration-150"
        onClick={onNavigate}
      >
        Settings
      </Link>
      {isAdmin && (
        <>
          <Link
            href="/admin/registrations"
            className="rounded-lg px-3 py-2 text-[#1A2B38] hover:bg-[#EEF2F5] transition-colors duration-150"
            onClick={onNavigate}
          >
            Project Registrations
          </Link>
          <Link
            href="/admin/issue-registrations"
            className="rounded-lg px-3 py-2 text-[#1A2B38] hover:bg-[#EEF2F5] transition-colors duration-150"
            onClick={onNavigate}
          >
            Issue Registrations
          </Link>
        </>
      )}
      {isSuper && (
        <Link
          href="/admin/manage"
          className="rounded-lg px-3 py-2 text-[#1A2B38] hover:bg-[#EEF2F5] transition-colors duration-150"
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
        className="w-full rounded-lg px-3 py-2 text-left text-rose-600 hover:bg-rose-50 transition-colors duration-150"
      >
        Sign out
      </button>
    </>
  );
}
