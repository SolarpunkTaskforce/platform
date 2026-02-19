"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { isAdmin as rpcIsAdmin, isSuperadmin as rpcIsSuper } from "@/lib/admin";

type OrganisationContext = {
  id: string;
  name: string;
  role: string;
};

export default function UserMenu({ onNavigate }: { onNavigate?: () => void }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuper, setIsSuper] = useState(false);

  const [orgs, setOrgs] = useState<OrganisationContext[]>([]);
  const [orgsOpen, setOrgsOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;
      if (!session) {
        setOrgs([]);
        return;
      }

      const [a, s] = await Promise.all([rpcIsAdmin(supabase), rpcIsSuper(supabase)]);
      if (!mounted) return;
      setIsAdmin(a);
      setIsSuper(s);

      const { data: orgMembers, error: memberError } = await supabase
        .from("organisation_members")
        .select("organisation_id, role")
        .eq("user_id", session.user.id);

      if (!mounted) return;

      if (memberError) {
        console.error("Failed to load organisation memberships", memberError);
        setOrgs([]);
        return;
      }

      const orgIds = Array.from(
        new Set((orgMembers ?? []).map((m) => m.organisation_id).filter(Boolean))
      ) as string[];

      const orgNameMap = new Map<string, string>();

      if (orgIds.length > 0) {
        const { data: orgRows, error: orgError } = await supabase
          .from("organisations_directory_v1")
          .select("id, name")
          .in("id", orgIds);

        if (!mounted) return;

        if (orgError) {
          console.error("Failed to load organisation names", orgError);
        } else {
          orgRows?.forEach((org) => {
            if (org.id) orgNameMap.set(org.id, org.name ?? "Organisation");
          });
        }
      }

      const nextOrgs: OrganisationContext[] = (orgMembers ?? [])
        .filter((m) => !!m.organisation_id)
        .map((m) => ({
          id: m.organisation_id as string,
          name: orgNameMap.get(m.organisation_id as string) ?? "Organisation",
          role: m.role ?? "member",
        }))
        // De-dupe by org id (just in case)
        .reduce<OrganisationContext[]>((acc, curr) => {
          if (acc.some((o) => o.id === curr.id)) return acc;
          acc.push(curr);
          return acc;
        }, []);

      // Sort by name for a clean menu
      nextOrgs.sort((a2, b2) => a2.name.localeCompare(b2.name));

      setOrgs(nextOrgs);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const orgSectionLabel = useMemo(() => {
    // Always show the label as requested
    return "My Organisation(s)";
  }, []);

  return (
    <>
      <Link
        href="/profile"
        className="rounded-lg px-3 py-2 text-[#1A2B38] hover:bg-[#EEF2F5] transition-colors duration-150"
        onClick={onNavigate}
      >
        My profile
      </Link>

      <div className="mt-1">
        <button
          type="button"
          onClick={() => setOrgsOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[#1A2B38] hover:bg-[#EEF2F5] transition-colors duration-150"
        >
          <span>{orgSectionLabel}</span>
          {orgsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        {orgsOpen && (
          <div className="mt-1 space-y-1 pl-2">
            {orgs.length > 0 &&
              orgs.map((org) => (
                <Link
                  key={org.id}
                  href={`/organisations/${org.id}`}
                  className="block rounded-lg px-3 py-2 text-[#1A2B38] hover:bg-[#EEF2F5] transition-colors duration-150"
                  onClick={onNavigate}
                >
                  {org.name}
                </Link>
              ))}

            <Link
              href="/organisations/create"
              className="block rounded-lg px-3 py-2 text-[#1A2B38] hover:bg-[#EEF2F5] transition-colors duration-150"
              onClick={onNavigate}
            >
              Create New Organisation
            </Link>
          </div>
        )}
      </div>

      <div className="my-2 border-t border-slate-200" />

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
