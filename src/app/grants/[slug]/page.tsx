import Link from "next/link";
import { notFound } from "next/navigation";

import type { Database } from "@/lib/database.types";
import { getServerSupabase } from "@/lib/supabaseServer";

type GrantRow = Database["public"]["Tables"]["grants"]["Row"];

const formatDate = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(date);
};

const formatCurrency = (amount: number | null, currency: string | null) => {
  if (typeof amount !== "number") return null;
  const resolvedCurrency = currency ?? "EUR";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: resolvedCurrency }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${resolvedCurrency}`;
  }
};

const formatAmountRange = (grant: GrantRow) => {
  const minLabel = formatCurrency(grant.amount_min, grant.currency);
  const maxLabel = formatCurrency(grant.amount_max, grant.currency);
  if (!minLabel && !maxLabel) return null;
  if (minLabel && maxLabel) return `${minLabel} – ${maxLabel}`;
  return minLabel ?? maxLabel;
};

export default async function GrantDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!slug || typeof slug !== "string") notFound();

  const supabase = await getServerSupabase();

  const { data: grant, error } = await supabase.from("grants").select("*").eq("slug", slug).single();

  if (error || !grant) {
    if (error?.code === "PGRST116" || error?.code === "42501") notFound();
    throw new Error(error?.message ?? "Failed to load grant.");
  }

  const amountRange = formatAmountRange(grant);
  const deadline = formatDate(grant.deadline);
  const openDate = formatDate(grant.open_date);
  const decisionDate = formatDate(grant.decision_date);
  const startDate = formatDate(grant.start_date);

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Grant opportunity</p>
        <h1 className="text-3xl font-semibold text-slate-900">{grant.title}</h1>
        {grant.summary ? <p className="text-base text-slate-600">{grant.summary}</p> : null}
      </header>

      <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Funder</h2>
          <p className="text-base text-slate-900">{grant.funder_name ?? "Not listed"}</p>
          {grant.funder_website ? (
            <Link href={grant.funder_website} className="text-sm text-emerald-700 hover:text-emerald-800">
              Visit funder website
            </Link>
          ) : null}
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Application</h2>
          <Link
            href={grant.application_url}
            className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Apply now
          </Link>
          {grant.contact_email ? <p className="text-sm text-slate-600">Contact: {grant.contact_email}</p> : null}
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Funding</h2>
          <p className="text-base text-slate-900 capitalize">{grant.funding_type}</p>
          <p className="text-sm text-slate-600">Amount: {amountRange ?? "Not specified"}</p>
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Focus</h2>
          <p className="text-base text-slate-900 capitalize">{grant.project_type}</p>
          <p className="text-sm text-slate-600">Status: {grant.status}</p>
        </div>
      </section>

      <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Key dates</h2>
          <ul className="space-y-1 text-sm text-slate-600">
            <li>Open date: {openDate ?? "—"}</li>
            <li>Deadline: {deadline ?? "—"}</li>
            <li>Decision date: {decisionDate ?? "—"}</li>
            <li>Start date: {startDate ?? "—"}</li>
          </ul>
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Eligibility</h2>
          <p className="text-sm text-slate-600">
            Eligible countries: {grant.eligible_countries?.length ? grant.eligible_countries.join(", ") : "Not specified"}
          </p>
          <p className="text-sm text-slate-600">Remote friendly: {grant.remote_ok ? "Yes" : "No"}</p>
          {grant.location_name ? <p className="text-sm text-slate-600">Location: {grant.location_name}</p> : null}
        </div>
      </section>

      {grant.description ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Details</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{grant.description}</p>
        </section>
      ) : null}
    </main>
  );
}
