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

type SearchParams = Record<string, string | string[] | undefined>;

export default async function FindFundingPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params: SearchParams = searchParams ? await searchParams : {};

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
    <main className="flex-1 min-h-0 px-6 py-8 flex flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">Find Funding</h1>
          <p className="text-sm text-slate-600">
            Discover funding opportunities to support environmental and humanitarian work.
          </p>
          <p className="text-sm text-slate-500">
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
