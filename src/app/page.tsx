import HomeGlobeSection from "@/components/home/HomeGlobeSection";
import { fetchHomeGrantMarkers } from "@/lib/grants/homeGrantsQuery";
import { fetchHomeProjectMarkers } from "@/lib/projects/homeProjectsQuery";
import { fetchHomeWatchdogMarkers } from "@/lib/watchdog/homeWatchdogQuery";

export default async function HomePage() {
  let markers: Awaited<ReturnType<typeof fetchHomeProjectMarkers>> = [];
  let grantMarkers: Awaited<ReturnType<typeof fetchHomeGrantMarkers>> = [];
  let issueMarkers: Awaited<ReturnType<typeof fetchHomeWatchdogMarkers>> = [];

  try {
    markers = await fetchHomeProjectMarkers();
  } catch (error) {
    console.error("Home globe: marker query failed", error);
  }

  try {
    grantMarkers = await fetchHomeGrantMarkers();
  } catch (error) {
    console.error("Home globe: funding marker query failed", error);
  }

  try {
    issueMarkers = await fetchHomeWatchdogMarkers();
  } catch (error) {
    console.error("Home globe: issue marker query failed", error);
  }

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Solarpunk Taskforce
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Discover regenerative projects around the globe.
          </h1>
          <p className="max-w-2xl text-base text-slate-600">
            Explore approved community projects, funding opportunities, and watchdog issues from the Solarpunk
            Taskforce ecosystem.
          </p>
        </div>
      </div>

      <HomeGlobeSection projectMarkers={markers} grantMarkers={grantMarkers} issueMarkers={issueMarkers} />
    </main>
  );
}
