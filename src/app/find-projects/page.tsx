import ProjectsFilters from "@/components/projects/ProjectsFilters";
import ProjectsGlobeSplitView from "@/components/projects/ProjectsGlobeSplitView";
import ProjectsTableView from "@/components/projects/ProjectsTableView";
import ProjectsViewToggle from "@/components/projects/ProjectsViewToggle";
import {
  PAGE_SIZE,
  fetchFindProjects,
  fetchProjectMarkers,
  type ProjectListRow,
} from "@/lib/projects/findProjectsQuery";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function FindProjectsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params: SearchParams = searchParams ? await searchParams : {};

  const viewParam = typeof params.view === "string" ? params.view : "globe";
  const view: "globe" | "table" = viewParam === "table" ? "table" : "globe";
  const focus = typeof params.focus === "string" ? params.focus : null;

  let rows: ProjectListRow[] = [];
  let count = 0;
  let page = 1;
  let pageCount = 1;

  try {
    const result = await fetchFindProjects({ searchParams: params });
    rows = result.rows;
    count = result.count;
    page = result.page;
    pageCount = result.pageCount;
  } catch (error) {
    console.error("Find projects: list query failed", error);
  }

  let markers: Awaited<ReturnType<typeof fetchProjectMarkers>> = [];
  if (view === "globe") {
    try {
      markers = await fetchProjectMarkers({ searchParams: params });
    } catch (error) {
      console.error("Find projects: marker query failed", error);
    }
  }

  return (
    <main className="flex-1 min-h-0 px-6 py-8 flex flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">Find Projects</h1>
          <p className="text-sm text-slate-600">
            Browse projects submitted to the Solarpunk Taskforce. Filter across environmental and humanitarian work.
          </p>
          <p className="text-sm text-slate-500">
            Showing {rows.length} of {count} projects · {PAGE_SIZE} per page
          </p>
        </div>
        <ProjectsViewToggle view={view} />
      </header>

      {view === "globe" ? (
        <div className="flex-1 min-h-0">
          <ProjectsGlobeSplitView markers={markers} totalCount={count} focusSlug={focus} />
        </div>
      ) : (
        <>
          <ProjectsFilters basePath="/find-projects" showSorting variant="panel" />
          <ProjectsTableView rows={rows} count={count} page={page} pageCount={pageCount} searchParams={params} />
        </>
      )}
    </main>
  );
}
