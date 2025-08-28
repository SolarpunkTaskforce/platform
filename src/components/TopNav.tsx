"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "lucide-react";

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
      return;
    }
    supabase
      .from("profiles")
      .select("id, kind, full_name, surname, organisation_name")
      .eq("id", sessionUserId)
      .single()
      .then(({ data }) => {
        setProfile((data ?? null) as Profile | null);
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
        onClick={() => { setMenuOpen(o => !o); setProfileOpen(false); }}
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
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <nav className="fixed top-0 right-0 z-50 flex h-screen w-64 flex-col bg-[#11526D] p-4 text-sm text-white">
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="px-4 py-2 hover:bg-white/10"
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </>
      )}
    </div>
  );

  const addButton = (
    <Link
      href="/add/project"
      className="grid h-9 w-9 place-items-center rounded-full border"
      aria-label="Add Project"
    >
      +
    </Link>
  );

  const controls = sessionUserId ? (
    <>
      <div className="relative">
        <button
          onClick={() => { setProfileOpen(o => !o); setMenuOpen(false); }}
          className="grid h-9 w-9 place-items-center rounded-full border"
          aria-label="Account"
        >
          {profile ? initials(profile) : <User className="h-4 w-4" />}
        </button>
        {profileOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
            <div className="fixed top-0 right-0 z-50 flex h-screen w-64 flex-col bg-[#11526D] p-4 text-sm text-white">
              <Link href="/dashboard" className="px-4 py-2 hover:bg-white/10" onClick={() => setProfileOpen(false)}>
                Profile
              </Link>
              <Link href="/settings" className="px-4 py-2 hover:bg-white/10" onClick={() => setProfileOpen(false)}>
                Settings
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.refresh();
                  setProfileOpen(false);
                }}
                className="px-4 py-2 text-left hover:bg-white/10"
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
      {addButton}
      {menu}
    </>
  ) : (
    <>
      {addButton}
      {menu}
      <Link href="/auth" className="rounded-xl border px-3 py-1 text-sm">Sign in</Link>
    </>
  );

  return (
    <header className="relative z-10 flex h-14 items-center justify-between px-6">
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
