import WatchdogFilters from "@/components/watchdog/WatchdogFilters";
import WatchdogGlobeSplitView from "@/components/watchdog/WatchdogGlobeSplitView";
import WatchdogTableView from "@/components/watchdog/WatchdogTableView";
import WatchdogViewToggle from "@/components/watchdog/WatchdogViewToggle";
import {
  PAGE_SIZE,
  fetchWatchdogFilterOptions,
  fetchWatchdogIssues,
  fetchWatchdogMarkers,
  type WatchdogIssueListRow,
} from "@/lib/watchdog/findWatchdogIssuesQuery";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function WatchdogPage({
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

  const filterOptions = await fetchWatchdogFilterOptions();

  let rows: WatchdogIssueListRow[] = [];
  let count = 0;
  let page = 1;
  let pageCount = 1;

  try {
    const result = await fetchWatchdogIssues({ searchParams: params });
    rows = result.rows;
    count = result.count;
    page = result.page;
    pageCount = result.pageCount;
  } catch (error) {
    console.error("Watchdog issues: list query failed", error);
  }

  let markers: Awaited<ReturnType<typeof fetchWatchdogMarkers>> = [];
  if (safeView === "globe") {
    try {
      markers = await fetchWatchdogMarkers({ searchParams: params });
    } catch (error) {
      console.error("Watchdog issues: marker query failed", error);
    }
  }

  return (
    <main className="flex-1 min-h-0 px-4 py-6 flex flex-col gap-4 sm:px-6 sm:py-8 sm:gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Watchdog Community</h1>
          <p className="text-sm text-slate-600">
            Community-reported issues that have been reviewed by the Solarpunk Taskforce.
          </p>
          <p className="text-sm text-slate-500">
            Showing {rows.length} of {count} issues · {PAGE_SIZE} per page
          </p>
        </div>
        <WatchdogViewToggle view={safeView} />
      </header>

      {safeView === "globe" ? (
        <div className="flex-1 min-h-0">
          <WatchdogGlobeSplitView markers={markers} totalCount={count} focusId={focus} options={filterOptions} />
        </div>
      ) : (
        <>
          <WatchdogFilters options={filterOptions} basePath="/watchdog" showSorting variant="panel" />
          <WatchdogTableView rows={rows} count={count} page={page} pageCount={pageCount} searchParams={params} />
        </>
      )}
    </main>
  );
}
