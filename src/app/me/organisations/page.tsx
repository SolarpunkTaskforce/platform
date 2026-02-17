"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Organisation = {
  id: string;
  name: string;
  verification_status: "pending" | "verified" | "rejected";
  role: "owner" | "admin" | "member";
};

export default function MyOrganisationsPage() {
  const router = useRouter();
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrganisations() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace("/login");
          return;
        }

        // Get all organisations where user is a member
        const { data, error } = await supabase
          .from("organisation_members")
          .select(`
            organisation_id,
            role,
            organisations (
              id,
              name,
              verification_status
            )
          `)
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const orgs = (data || [])
          .filter((item): item is typeof item & { organisations: { id: string; name: string; verification_status: string } } =>
            !!item.organisations
          )
          .map((item) => ({
            id: item.organisations.id,
            name: item.organisations.name,
            verification_status: item.organisations.verification_status as "pending" | "verified" | "rejected",
            role: item.role as "owner" | "admin" | "member",
          }));

        setOrganisations(orgs);
      } catch (err) {
        console.error("Error loading organisations:", err);
        setError(err instanceof Error ? err.message : "Failed to load organisations");
      } finally {
        setLoading(false);
      }
    }

    loadOrganisations();
  }, [router]);

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
        <div className="text-center text-soltas-muted">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
        <div className="rounded-lg border border-rose-400/25 bg-rose-50 p-4 text-rose-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-soltas-bark">My Organisations</h1>
        <Link
          href="/organisations/create"
          className="rounded-xl bg-[#2E6B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1A3F54]"
        >
          Create Organisation
        </Link>
      </div>

      {organisations.length === 0 ? (
        <div className="rounded-2xl border border-[#6B9FB8]/25 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto max-w-md space-y-4">
            <h2 className="text-xl font-semibold text-soltas-bark">No organisations yet</h2>
            <p className="text-sm text-soltas-muted">
              Create an organisation to represent your community, project, or initiative on the
              platform.
            </p>
            <Link
              href="/organisations/create"
              className="inline-block rounded-xl bg-[#2E6B8A] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1A3F54]"
            >
              Create Organisation
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {organisations.map((org) => (
            <Link
              key={org.id}
              href={`/organisations/${org.id}`}
              className="block rounded-2xl border border-[#6B9FB8]/25 bg-white p-6 shadow-sm transition hover:border-[#2E6B8A] hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-soltas-bark">{org.name}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm text-soltas-muted capitalize">Role: {org.role}</span>
                    <span className="text-soltas-muted">•</span>
                    <span
                      className={`text-sm font-medium ${
                        org.verification_status === "verified"
                          ? "text-green-600"
                          : org.verification_status === "pending"
                            ? "text-amber-600"
                            : "text-rose-600"
                      }`}
                    >
                      {org.verification_status === "verified" && "✓ Verified"}
                      {org.verification_status === "pending" && "⏳ Pending Verification"}
                      {org.verification_status === "rejected" && "✗ Rejected"}
                    </span>
                  </div>
                </div>
                <span className="text-[#2E6B8A]">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
