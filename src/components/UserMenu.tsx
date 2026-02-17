"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
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
  const [userId, setUserId] = useState<string | null>(null);
  const [organisations, setOrganisations] = useState<OrganisationContext[]>([]);
  const [activeOrg, setActiveOrg] = useState<OrganisationContext | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || !mounted) return;

      setUserId(session.user.id);

      const [a, s] = await Promise.all([
        rpcIsAdmin(supabase),
        rpcIsSuper(supabase),
      ]);
      if (!mounted) return;
      setIsAdmin(a);
      setIsSuper(s);

      // Fetch user's organisations
      const { data: orgMembers } = await supabase
        .from("organisation_members")
        .select("organisation_id, role, organisations(id, name)")
        .eq("user_id", session.user.id);

      if (!mounted) return;

      const orgs: OrganisationContext[] = (orgMembers ?? [])
        .map((member) => {
          const org = Array.isArray(member.organisations)
            ? member.organisations[0]
            : member.organisations;
          if (org?.id && org?.name) {
            return {
              id: org.id,
              name: org.name,
              role: member.role ?? "member",
            };
          }
          return null;
        })
        .filter((org): org is OrganisationContext => org !== null);

      setOrganisations(orgs);

      // Set first org with owner/admin role as active, or first org if any
      const ownerOrAdminOrg = orgs.find((org) => org.role === "owner" || org.role === "admin");
      setActiveOrg(ownerOrAdminOrg ?? orgs[0] ?? null);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const canManageOrg = activeOrg && (activeOrg.role === "owner" || activeOrg.role === "admin");

  return (
    <>
      <Link
        href="/profile"
        className="rounded-lg px-3 py-2 text-[#1A2B38] hover:bg-[#EEF2F5] transition-colors duration-150"
        onClick={onNavigate}
      >
        My profile
      </Link>
      <Link
        href="/me/organisations"
        className="rounded-lg px-3 py-2 text-[#1A2B38] hover:bg-[#EEF2F5] transition-colors duration-150"
        onClick={onNavigate}
      >
        My organisations
      </Link>

      {activeOrg && (
        <>
          <div className="my-2 border-t border-slate-200" />
          <Link
            href={`/organisations/${activeOrg.id}`}
            className="rounded-lg px-3 py-2 text-[#1A2B38] hover:bg-[#EEF2F5] transition-colors duration-150"
            onClick={onNavigate}
          >
            Organisation profile
          </Link>
          {canManageOrg && (
            <>
              <Link
                href={`/organisations/${activeOrg.id}/edit`}
                className="rounded-lg px-3 py-2 text-[#1A2B38] hover:bg-[#EEF2F5] transition-colors duration-150"
                onClick={onNavigate}
              >
                Edit organisation
              </Link>
              <Link
                href={`/organisations/${activeOrg.id}/members`}
                className="rounded-lg px-3 py-2 text-[#1A2B38] hover:bg-[#EEF2F5] transition-colors duration-150"
                onClick={onNavigate}
              >
                Members
              </Link>
            </>
          )}
        </>
      )}

      {organisations.length === 0 && (
        <>
          <div className="my-2 border-t border-slate-200" />
          <Link
            href="/onboarding/organisation"
            className="rounded-lg px-3 py-2 text-[#1A2B38] hover:bg-[#EEF2F5] transition-colors duration-150"
            onClick={onNavigate}
          >
            Create organisation
          </Link>
        </>
      )}

      <div className="my-2 border-t border-slate-200" />
      <Link
        href="/me/organisations"
        className="rounded-lg px-3 py-2 text-[#1A2B38] hover:bg-[#EEF2F5] transition-colors duration-150"
        onClick={onNavigate}
      >
        My Organisations
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
      <Link
        href="/organisations/create"
        className="rounded-lg px-3 py-2 text-[#1A2B38] hover:bg-[#EEF2F5] transition-colors duration-150"
        onClick={onNavigate}
      >
        Create organisation
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
