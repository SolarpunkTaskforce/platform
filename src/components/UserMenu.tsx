"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { isAdmin as rpcIsAdmin, isSuperadmin as rpcIsSuper } from "@/lib/admin";

export default function UserMenu() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuper, setIsSuper] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (session) {
        const a = await rpcIsAdmin(supabase);
        const s = await rpcIsSuper(supabase);
        if (mounted) {
          setIsAdmin(a);
          setIsSuper(s);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="relative">
      {/* your avatar button here */}
      <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-white p-2 shadow">
        <Link href="/profile" className="block rounded px-3 py-2 hover:bg-gray-100">Profile</Link>
        <Link href="/settings" className="block rounded px-3 py-2 hover:bg-gray-100">Settings</Link>
        {isAdmin && (
          <Link href="/admin/registrations" className="block rounded px-3 py-2 hover:bg-gray-100">Project Registrations</Link>
        )}
        {isSuper && (
          <Link href="/admin/manage" className="block rounded px-3 py-2 hover:bg-gray-100">Manage Admins</Link>
        )}
        <button
          className="block w-full rounded px-3 py-2 text-left hover:bg-gray-100"
          onClick={() => supabase.auth.signOut()}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
