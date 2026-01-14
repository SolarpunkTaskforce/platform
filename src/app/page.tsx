import Link from "next/link";

import HomeGlobe from "@/components/home/HomeGlobe";
import { fetchHomeProjectMarkers } from "@/lib/projects/homeProjectsQuery";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  let markers: Awaited<ReturnType<typeof fetchHomeProjectMarkers>> = [];

  try {
    markers = await fetchHomeProjectMarkers();
  } catch (error) {
    console.error("Home globe: marker query failed", error);
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

        <div className="flex flex-wrap gap-3">
          <Link
            href="/find-projects"
            className={cn(
              "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 py-2 font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
              "bg-emerald-600 text-white hover:bg-emerald-700",
            )}
          >
            Find Projects
          </Link>
          <Link
            href="/funding"
            className={cn(
              "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 py-2 font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
              "border border-slate-200 text-slate-900 hover:bg-slate-100",
            )}
          >
            Find Funding
          </Link>
          <Link
            href="/watchdog"
            className={cn(
              "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 py-2 font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
              "border border-slate-200 text-slate-900 hover:bg-slate-100",
            )}
          >
            Find Issues
          </Link>
        </div>
      </div>

      <div className="min-h-[60vh] flex-1">
        <HomeGlobe markers={markers} />
      </div>
    </main>
  );
}
