"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, User, Building2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type Identity = {
  type: "individual";
  id: string;
  name: string;
} | {
  type: "organisation";
  id: string;
  name: string;
  role: string;
};

const ACTIVE_IDENTITY_KEY = "soltas_active_identity";

export default function IdentitySwitcher() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ full_name: string | null; surname: string | null } | null>(null);
  const [organisations, setOrganisations] = useState<Array<{ id: string; name: string; role: string }>>([]);
  const [activeIdentity, setActiveIdentity] = useState<Identity | null>(null);
  const router = useRouter();

  // Load user session and profile
  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted || !data.user) return;
      setUserId(data.user.id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return;
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Load user profile and organizations
  useEffect(() => {
    if (!userId) {
      // Use microtasks to avoid synchronous setState in effect
      queueMicrotask(() => {
        setUserProfile(null);
        setOrganisations([]);
        setActiveIdentity(null);
      });
      return;
    }

    let mounted = true;

    (async () => {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, surname")
        .eq("id", userId)
        .maybeSingle();

      if (!mounted) return;
      setUserProfile(profileError ? null : profile);

      // Fetch user's organisations
      const { data: orgMembers, error: memberError } = await supabase
        .from("organisation_members")
        .select("organisation_id, role")
        .eq("user_id", userId);

      if (!mounted) return;

      if (memberError) {
        console.error("Failed to load organisation memberships", memberError);
        setOrganisations([]);
        return;
      }

      const orgIds = Array.from(
        new Set((orgMembers ?? []).map((member) => member.organisation_id).filter(Boolean))
      );

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

      const orgs = (orgMembers ?? []).map((member) => ({
        id: member.organisation_id,
        name: orgNameMap.get(member.organisation_id) ?? "Organisation",
        role: member.role ?? "member",
      }));

      setOrganisations(orgs);

      // Load active identity from localStorage or default to individual
      try {
        const stored = localStorage.getItem(ACTIVE_IDENTITY_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Validate stored identity is still valid
          if (parsed.type === "individual" && parsed.id === userId) {
            setActiveIdentity(parsed);
            return;
          } else if (parsed.type === "organisation") {
            const orgExists = orgs.find((o) => o.id === parsed.id);
            if (orgExists) {
              setActiveIdentity(parsed);
              return;
            }
          }
        }
      } catch {
        // Invalid localStorage data, ignore
      }

      // Default to individual identity
      const userName = [profile?.full_name, profile?.surname].filter(Boolean).join(" ") || "Me";
      const defaultIdentity: Identity = {
        type: "individual",
        id: userId,
        name: userName,
      };
      setActiveIdentity(defaultIdentity);
      try {
        localStorage.setItem(ACTIVE_IDENTITY_KEY, JSON.stringify(defaultIdentity));
      } catch {
        // localStorage not available
      }
    })();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const switchToIndividual = () => {
    if (!userId || !userProfile) return;

    const userName = [userProfile.full_name, userProfile.surname].filter(Boolean).join(" ") || "Me";
    const identity: Identity = {
      type: "individual",
      id: userId,
      name: userName,
    };
    setActiveIdentity(identity);
    try {
      localStorage.setItem(ACTIVE_IDENTITY_KEY, JSON.stringify(identity));
    } catch {
      // localStorage not available
    }
    router.push(`/people/${userId}`);
  };

  const switchToOrganisation = (org: { id: string; name: string; role: string }) => {
    const identity: Identity = {
      type: "organisation",
      id: org.id,
      name: org.name,
      role: org.role,
    };
    setActiveIdentity(identity);
    try {
      localStorage.setItem(ACTIVE_IDENTITY_KEY, JSON.stringify(identity));
    } catch {
      // localStorage not available
    }
    router.push(`/organisations/${org.id}`);
  };

  if (!activeIdentity) {
    return null;
  }

  const currentLabel = activeIdentity.type === "individual"
    ? `Me (${activeIdentity.name})`
    : `Organisation (${activeIdentity.name})`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 text-xs sm:text-sm"
          aria-label="Switch identity"
        >
          {activeIdentity.type === "individual" ? (
            <User className="h-3.5 w-3.5" />
          ) : (
            <Building2 className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">{currentLabel}</span>
          <span className="sm:hidden">{activeIdentity.type === "individual" ? "Me" : "Org"}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuLabel>Switch Identity</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={switchToIndividual}>
          <User className="mr-2 h-4 w-4" />
          <span>Me ({userProfile?.full_name || userProfile?.surname || "Individual"})</span>
          {activeIdentity.type === "individual" && (
            <span className="ml-auto text-soltas-ocean">✓</span>
          )}
        </DropdownMenuItem>

        {organisations.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>My Organisations</DropdownMenuLabel>
            {organisations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => switchToOrganisation(org)}
              >
                <Building2 className="mr-2 h-4 w-4" />
                <span>{org.name}</span>
                {activeIdentity.type === "organisation" && activeIdentity.id === org.id && (
                  <span className="ml-auto text-soltas-ocean">✓</span>
                )}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
