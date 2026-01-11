"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Plus, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import UserMenu from "@/components/UserMenu";

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

export default function Header() {
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setSessionUserId(data.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSessionUserId(s?.user?.id ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
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

  useEffect(() => {
    if (!sessionUserId) {
      setUnreadCount(0);
      return;
    }

    let active = true;
    const loadUnreadCount = async () => {
      const { data, error } = await supabase.rpc("get_unread_notification_count");
      if (active && !error) {
        setUnreadCount(typeof data === "number" ? data : 0);
      }
    };

    loadUnreadCount();

    const handleUpdate = () => {
      loadUnreadCount();
    };

    window.addEventListener("notifications:updated", handleUpdate);
    return () => {
      active = false;
      window.removeEventListener("notifications:updated", handleUpdate);
    };
  }, [sessionUserId]);

  const projectLinks = useMemo(
    () => [
      { href: "/projects/humanitarian", label: "Humanitarian Projects" },
      { href: "/projects/environmental", label: "Environmental Projects" },
    ],
    []
  );

  const navLinks = useMemo(
    () => [
      { href: "/", label: "Home" },
      { href: "/about", label: "About" },
      { href: "/find-projects", label: "Find Projects" },
      { href: "/find-organisations", label: "Find Organisations" },
      { href: "/feed", label: "Feed" },
      { href: "/note-empathy", label: "Note Empathy" },
      { href: "/services", label: "Services" },
    ],
    []
  );

  const menu = (
    <div className="relative">
      <button
        onClick={() => {
          setMenuOpen(o => !o);
          setProfileOpen(false);
        }}
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
            {projectLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="px-4 py-2 hover:bg-white/10 md:hidden"
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </Link>
            ))}
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
      href="/projects/new"
      className="grid h-9 w-9 place-items-center rounded-full border"
      aria-label="Add Project"
    >
      <Plus className="h-4 w-4" />
    </Link>
  );

  const profileControls = (
    <div className="relative">
      <button
        onClick={() => {
          setProfileOpen(o => !o);
          setMenuOpen(false);
        }}
        className="grid h-9 w-9 place-items-center rounded-full border"
        aria-label="Account"
      >
        {profile ? <span className="text-xs font-semibold">{initials(profile)}</span> : <User className="h-4 w-4" />}
      </button>
      {profileOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
          <nav className="fixed top-0 right-0 z-50 flex h-screen w-64 flex-col bg-[#11526D] p-4 text-sm text-white">
            <UserMenu onNavigate={() => setProfileOpen(false)} />
          </nav>
        </>
      )}
    </div>
  );

  const notificationsButton = (
    <Link
      href="/notifications"
      className="relative grid h-9 w-9 place-items-center rounded-full border"
      aria-label="Notifications"
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
          {unreadCount}
        </span>
      ) : null}
    </Link>
  );

  return (
    <header className="relative z-10 flex h-14 items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={() => {
            setMenuOpen(false);
            router.push("/");
          }}
          className="text-lg font-semibold"
          aria-label="Home"
        >
          Solarpunk Taskforce
        </button>
        <nav className="hidden items-center gap-4 text-sm md:flex">
          {projectLinks.map(link => (
            <Link key={link.href} href={link.href} className="font-medium text-slate-800 hover:text-slate-950">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        {menu}
        {sessionUserId ? (
          <>
            {addButton}
            {notificationsButton}
            {profileControls}
          </>
        ) : (
          <Link href="/auth" className="rounded-xl border px-3 py-1 text-sm">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
