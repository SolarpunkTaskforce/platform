"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  const [profileLoading, setProfileLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => { if (active) setSessionUserId(data.user?.id ?? null); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSessionUserId(s?.user?.id ?? null);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!sessionUserId) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    supabase
      .from("profiles")
      .select("id, kind, full_name, surname, organisation_name")
      .eq("id", sessionUserId)
      .single()
      .then(({ data }) => {
        setProfile((data ?? null) as Profile | null);
        setProfileLoading(false);
      });
  }, [sessionUserId]);

  const navLinks = useMemo(() => ([
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/find-projects", label: "Find Projects" },
    { href: "/find-organisations", label: "Find Organisations" },
    { href: "/feed", label: "Feed" },
    { href: "/note-empathy", label: "Note Empathy" },
    { href: "/services", label: "Services" },
  ]), []);

  const menu = (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(o => !o)}
        className="grid h-9 w-9 place-items-center rounded-full border"
        aria-label="Menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {menuOpen && (
        <nav className="absolute right-0 mt-2 flex flex-col rounded border bg-white text-sm shadow z-50">
          {navLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="px-4 py-2 hover:bg-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );

  const controls = profile ? (
    <>
      <AddAction accountKind={profile.kind} />
      <div className="relative">
        <button
          onClick={() => setProfileOpen(o => !o)}
          className="grid h-9 w-9 place-items-center rounded-full border text-xs"
          aria-label="Account"
        >
          {initials(profile)}
        </button>
        {profileOpen && (
          <div className="absolute right-0 mt-2 w-40 rounded border bg-white text-sm shadow">
            <Link href="/dashboard" className="block px-4 py-2 hover:bg-gray-100">
              Profile
            </Link>
            <Link href="/settings" className="block px-4 py-2 hover:bg-gray-100">
              Settings
            </Link>
          </div>
        )}
      </div>
      {menu}
    </>
  ) : sessionUserId && !profileLoading ? (
    <>
      {menu}
      <Link href="/dashboard" className="rounded-xl border px-3 py-1 text-sm">Complete profile</Link>
    </>
  ) : (
    <>
      {menu}
      <Link href="/auth" className="rounded-xl border px-3 py-1 text-sm">Sign in</Link>
    </>
  );

  return (
    <header className="relative z-10 flex items-center justify-between px-6 py-3">
      <button
        type="button"
        onClick={() => { setMenuOpen(false); router.push("/"); }}
        className="text-lg font-semibold"
      >
        Solarpunk Taskforce
      </button>
      <div className="flex items-center gap-3">{controls}</div>
    </header>
  );
}
