"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import AddAction from "@/components/add/AddAction";

type Profile = {
  id: string;
  kind: "individual" | "organisation";
  full_name: string | null;
  surname: string | null;
  organisation_name: string | null;
};

function initials(p: Profile | null) {
  if (!p) return "•";
  if (p.kind === "organisation") return (p.organisation_name ?? "Org").slice(0, 2).toUpperCase();
  const name = [p.full_name, p.surname].filter(Boolean).join(" ");
  return name ? name.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase() : "U";
}

export default function TopNav() {
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSessionUserId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSessionUserId(s?.user?.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!sessionUserId) { setProfile(null); return; }
    supabase
      .from("profiles")
      .select("id, kind, full_name, surname, organisation_name")
      .eq("id", sessionUserId)
      .single()
      .then(({ data }) => setProfile(data as Profile));
  }, [sessionUserId]);

  const navLinks = useMemo(() => ([
    { href: "/about", label: "About" },
    { href: "/find-projects", label: "Find Projects" },
    { href: "/find-organisations", label: "Find Organisations" },
    { href: "/feed", label: "Feed" },
    { href: "/note-empathy", label: "Note Empathy" },
    { href: "/services", label: "Services" },
  ]), []);

  return (
    <header className="flex items-center justify-between px-6 py-3">
      <Link href="/" className="text-lg font-semibold">Solarpunk Taskforce</Link>
      <nav className="hidden gap-5 md:flex">
        {navLinks.map(l => (
          <Link key={l.href} href={l.href} className="text-sm hover:underline">{l.label}</Link>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        {profile && <AddAction accountKind={profile.kind} />}
        {profile ? (
          <Link href="/dashboard" className="grid h-9 w-9 place-items-center rounded-full border text-xs">
            {initials(profile)}
          </Link>
        ) : (
          <Link href="/auth" className="rounded-xl border px-3 py-1 text-sm">Sign in</Link>
        )}
      </div>
    </header>
  );
}
