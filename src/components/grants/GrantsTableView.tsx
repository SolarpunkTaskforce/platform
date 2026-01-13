import Link from "next/link";

import GrantsPagination from "@/components/grants/GrantsPagination";
import { Badge } from "@/components/ui/badge";
import type { GrantListRow } from "@/lib/grants/findGrantsQuery";
import { cn } from "@/lib/utils";

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(date);
};

const formatCurrency = (amount: number | null, currency: string | null) => {
  if (typeof amount !== "number") return "—";
  const resolvedCurrency = currency ?? "EUR";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: resolvedCurrency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (error) {
    console.error("currency-format", error);
    return `${amount.toLocaleString()} ${resolvedCurrency}`;
  }
};

const formatAmountRange = (grant: GrantListRow) => {
  const minLabel = typeof grant.amount_min === "number" ? formatCurrency(grant.amount_min, grant.currency) : null;
  const maxLabel = typeof grant.amount_max === "number" ? formatCurrency(grant.amount_max, grant.currency) : null;
  if (!minLabel && !maxLabel) return "—";
  if (minLabel && maxLabel) return `${minLabel} – ${maxLabel}`;
  return minLabel ?? maxLabel ?? "—";
};

const formatEligibility = (grant: GrantListRow) => {
  if (grant.eligible_countries?.length) {
    return grant.eligible_countries.slice(0, 3).join(", ");
  }
  return "—";
};

const getGrantSlug = (grant: GrantListRow) => grant.slug ?? grant.id;

const buttonClasses =
  "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50";

const buttonSizes = {
  sm: "h-9 px-3",
} as const;

const buttonVariants = {
  secondary: "bg-slate-900 text-white hover:bg-slate-800",
  outline: "border border-slate-200 text-slate-900 hover:bg-slate-100",
} as const;

type GrantsTableViewProps = {
  rows: GrantListRow[];
  count: number;
  page: number;
  pageCount: number;
  searchParams: Record<string, string | string[] | undefined>;
};

export default function GrantsTableView({ rows, count, page, pageCount, searchParams }: GrantsTableViewProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">Showing {rows.length} of {count} grants</p>
        <GrantsPagination page={page} pageCount={pageCount} searchParams={searchParams} basePath="/find-grants" />
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Grant</th>
              <th className="px-4 py-3">Funding</th>
              <th className="px-4 py-3">Project type</th>
              <th className="px-4 py-3">Eligibility</th>
              <th className="px-4 py-3">Deadline</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(grant => {
              const slugForPath = getGrantSlug(grant);
              const focusSlug = grant.slug ?? null;
              const mapParams = new URLSearchParams();
              mapParams.set("view", "globe");
              if (focusSlug) {
                mapParams.set("focus", focusSlug);
              }
              const mapHref = `/find-grants?${mapParams.toString()}`;

              return (
                <tr key={grant.id} className="align-top">
                  <td className="px-4 py-4">
                    <Link
                      className="font-semibold text-emerald-700 hover:text-emerald-800"
                      href={`/grants/${encodeURIComponent(slugForPath)}`}
                    >
                      {grant.title}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">
                      {grant.funder_name ? `Funder: ${grant.funder_name}` : "Funder not listed"}
                    </p>
                    {grant.summary ? <p className="mt-2 text-xs text-slate-500">{grant.summary}</p> : null}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    <div className="capitalize">{grant.funding_type}</div>
                    <div className="text-xs text-slate-400">Status: {grant.status}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    <Badge variant="outline" className="capitalize">
                      {grant.project_type}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{formatEligibility(grant)}</td>
                  <td className="px-4 py-4 text-slate-600">
                    <div>{formatDate(grant.deadline)}</div>
                    <div className="text-xs text-slate-400">Open: {formatDate(grant.open_date)}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{formatAmountRange(grant)}</td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-end">
                      <Link
                        href={`/grants/${encodeURIComponent(slugForPath)}`}
                        className={cn(buttonClasses, buttonSizes.sm, buttonVariants.secondary)}
                      >
                        Open
                      </Link>
                      <Link href={mapHref} className={cn(buttonClasses, buttonSizes.sm, buttonVariants.outline)}>
                        See on map
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          No grants match the selected filters.
        </div>
      ) : null}

      <GrantsPagination page={page} pageCount={pageCount} searchParams={searchParams} basePath="/find-grants" />
    </section>
  );
}
