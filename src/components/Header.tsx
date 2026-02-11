"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import UserMenu from "@/components/UserMenu";
import CreateMenuButton from "@/components/CreateMenuButton";

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

type NavLinkItem = { type: "link"; href: string; label: string };
type NavDropdownItem = { type: "dropdown"; label: string; items: Array<{ href: string; label: string }> };
type NavItem = NavLinkItem | NavDropdownItem;

export default function Header() {
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

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
      .eq("id,kind", `${sessionUserId},individual`) // harmless if kind differs; but avoid: remove if you want exact existing behavior
      .single()
      .then(({ data, error }) => {
        // If the above filter causes issues in your schema, remove the .eq("id,kind"...)
        // and keep only .eq("id", sessionUserId) like you had before.
        if (error) {
          // fallback to original behavior
          supabase
            .from("profiles")
            .select("id, kind, full_name, surname, organisation_name")
            .eq("id", sessionUserId)
            .single()
            .then(({ data: data2 }) => setProfile((data2 ?? null) as Profile | null));
          return;
        }
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
      if (active && !error) setUnreadCount(typeof data === "number" ? data : 0);
    };

    loadUnreadCount();

    const handleUpdate = () => loadUnreadCount();
    window.addEventListener("notifications:updated", handleUpdate);

    return () => {
      active = false;
      window.removeEventListener("notifications:updated", handleUpdate);
    };
  }, [sessionUserId]);

  const navItems = useMemo<NavItem[]>(
    () => [
      { type: "link", href: "/", label: "Home" },
      {
        type: "dropdown",
        label: "About",
        items: [
          { href: "/about", label: "What is Solarpunk Taskforce" },
          { href: "/services", label: "Services" },
        ],
      },
      {
        type: "dropdown",
        label: "Find",
        items: [
          { href: "/projects", label: "Find Projects" },
          { href: "/organisations", label: "Find Organisations" },
          { href: "/funding", label: "Find Funding" },
          { href: "/watchdog", label: "Watchdog Community" },
        ],
      },
      { type: "link", href: "/feed", label: "Feed" },
    ],
    []
  );

  // Accept optional just in case, but our NavItem typing guarantees href for link items.
  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href;
  };

  const isDropdownActive = (items: { href: string }[]) => items.some(item => pathname === item.href);

  const addButton = <CreateMenuButton />;

  const profileControls = (
    <div className="relative">
      <button
        onClick={() => setProfileOpen(o => !o)}
        className="grid h-9 w-9 place-items-center rounded-full border"
        aria-label="Account"
      >
        {profile ? <span className="text-xs font-semibold">{initials(profile)}</span> : <User className="h-4 w-4" />}
      </button>

      {profileOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
          <nav className="fixed right-0 top-0 z-50 flex h-screen w-64 flex-col bg-[#11526D] p-4 text-sm text-white">
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
    <header className="relative z-10 border-b bg-white">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-lg font-semibold"
            aria-label="Home"
          >
            Solarpunk Taskforce
          </button>

          <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
            {navItems.map(item => {
              if (item.type === "link") {
                // item.href is guaranteed by NavLinkItem typing
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm font-medium transition ${
                      active ? "text-[#11526D]" : "text-slate-600 hover:text-slate-900"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                );
              }

              const active = isDropdownActive(item.items);

              return (
                <div key={item.label} className="group relative">
                  <button
                    type="button"
                    className={`flex items-center gap-1 text-sm font-medium transition ${
                      active ? "text-[#11526D]" : "text-slate-600 hover:text-slate-900"
                    }`}
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    {item.label}
                    <span aria-hidden="true" className="text-xs">
                      ▾
                    </span>
                  </button>

                  <div className="invisible absolute left-0 top-full z-20 mt-2 w-56 rounded-xl border bg-white py-2 text-sm text-slate-700 shadow-lg opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                    {item.items.map(link => {
                      const childActive = isActive(link.href);
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`block px-4 py-2 transition ${
                            childActive ? "bg-slate-100 text-[#11526D]" : "hover:bg-slate-50"
                          }`}
                          aria-current={childActive ? "page" : undefined}
                        >
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {sessionUserId ? (
            <>
              {addButton}
              {notificationsButton}
              {profileControls}
            </>
          ) : (
            <Link href="/login" className="rounded-xl border px-3 py-1 text-sm">
              Sign in
            </Link>
            <Link href="/signup" className="rounded-xl bg-slate-900 px-3 py-1 text-sm text-white">
              Register
            </Link>
          )}
        </div>
      </div>

      <nav className="flex flex-col gap-2 px-6 pb-4 md:hidden" aria-label="Primary">
        {navItems.map(item => {
          if (item.type === "link") {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  active ? "bg-slate-100 text-[#11526D]" : "text-slate-700"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          }

          const active = isDropdownActive(item.items);

          return (
            <details key={item.label} className="rounded-lg border" open={active}>
              <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-slate-700">
                <span className="flex items-center justify-between">
                  {item.label}
                  <span aria-hidden="true" className="text-xs text-slate-500">
                    ▾
                  </span>
                </span>
              </summary>

              <div className="flex flex-col gap-1 pb-2">
                {item.items.map(link => {
                  const childActive = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`mx-2 rounded-md px-3 py-2 text-sm ${
                        childActive ? "bg-slate-100 text-[#11526D]" : "text-slate-600"
                      }`}
                      aria-current={childActive ? "page" : undefined}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </details>
          );
        })}
      </nav>
    </header>
  );
}
