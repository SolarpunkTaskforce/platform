import GrantsFilters from "@/components/grants/GrantsFilters";
import GrantsGlobeSplitView from "@/components/grants/GrantsGlobeSplitView";
import GrantsTableView from "@/components/grants/GrantsTableView";
import GrantsViewToggle from "@/components/grants/GrantsViewToggle";
import {
  PAGE_SIZE,
  fetchFindGrants,
  fetchGrantFilterOptions,
  fetchGrantMarkers,
  type GrantListRow,
} from "@/lib/grants/findGrantsQuery";
import { getServerSupabase } from "@/lib/supabaseServer";
import Link from "next/link";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function FindFundingPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params: SearchParams = searchParams ? await searchParams : {};

  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Funding is only visible to authenticated users
  if (!user) {
    return (
      <main className="flex-1 min-h-0 px-4 py-6 flex flex-col gap-4 sm:px-6 sm:py-8 sm:gap-6">
        <header className="space-y-4">
          <h1 className="text-2xl font-semibold text-soltas-bark sm:text-3xl">Find Funding</h1>
          <p className="text-sm text-soltas-muted">
            Discover funding opportunities to support environmental and humanitarian work.
          </p>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-md text-center space-y-4 p-8 rounded-lg border border-slate-200 bg-white">
            <h2 className="text-xl font-semibold text-soltas-bark">Authentication Required</h2>
            <p className="text-sm text-soltas-muted">
              Log in or make an account to find funding opportunities.
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 font-semibold bg-soltas-ocean text-white hover:bg-soltas-abyssal transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 font-semibold border border-slate-200 text-soltas-bark hover:bg-slate-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const mapboxEnabled =
    typeof process.env.NEXT_PUBLIC_MAPBOX_TOKEN === "string" &&
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN.length > 0;

  const defaultView = mapboxEnabled ? "globe" : "table";
  const viewParam = typeof params.view === "string" ? params.view : defaultView;
  const view: "globe" | "table" = viewParam === "table" ? "table" : "globe";
  const safeView: "globe" | "table" = mapboxEnabled ? view : "table";
  const focus = typeof params.focus === "string" ? params.focus : null;

  const filterOptions = await fetchGrantFilterOptions();

  let rows: GrantListRow[] = [];
  let count = 0;
  let page = 1;
  let pageCount = 1;

  try {
    const result = await fetchFindGrants({ searchParams: params });
    rows = result.rows;
    count = result.count;
    page = result.page;
    pageCount = result.pageCount;
  } catch (error) {
    console.error("Find funding: list query failed", error);
  }

  let markers: Awaited<ReturnType<typeof fetchGrantMarkers>> = [];
  if (view === "globe") {
    try {
      markers = await fetchGrantMarkers({ searchParams: params });
    } catch (error) {
      console.error("Find funding: marker query failed", error);
    }
  }

  return (
    <main className="flex-1 min-h-0 px-4 py-6 flex flex-col gap-4 sm:px-6 sm:py-8 sm:gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-soltas-bark sm:text-3xl">Find Funding</h1>
          <p className="text-sm text-soltas-muted">
            Discover funding opportunities to support environmental and humanitarian work.
          </p>
          <p className="text-sm text-soltas-muted">
            Showing {rows.length} of {count} funding opportunities · {PAGE_SIZE} per page
          </p>
        </div>
        <GrantsViewToggle view={safeView} />
      </header>

      {safeView === "globe" ? (
        <div className="flex-1 min-h-0">
          <GrantsGlobeSplitView options={filterOptions} markers={markers} totalCount={count} focusSlug={focus} />
        </div>
      ) : (
        <>
          <GrantsFilters options={filterOptions} basePath="/funding" showSorting variant="panel" />
          <GrantsTableView rows={rows} count={count} page={page} pageCount={pageCount} searchParams={params} />
        </>
      )}
    </main>
  );
}
