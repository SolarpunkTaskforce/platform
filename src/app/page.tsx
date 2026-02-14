import Link from "next/link";
import { Suspense } from "react";

import HomeGlobeSection from "@/components/home/HomeGlobeSection";
import { fetchHomeGrantMarkers } from "@/lib/grants/homeGrantsQuery";
import { fetchHomeStats } from "@/lib/homeStatsQuery";
import { logOnce } from "@/lib/logOnce";
import { fetchHomeProjectMarkers } from "@/lib/projects/homeProjectsQuery";
import { fetchHomeWatchdogMarkers } from "@/lib/watchdog/homeWatchdogQuery";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  let markers: Awaited<ReturnType<typeof fetchHomeProjectMarkers>> = [];
  let grantMarkers: Awaited<ReturnType<typeof fetchHomeGrantMarkers>> = [];
  let issueMarkers: Awaited<ReturnType<typeof fetchHomeWatchdogMarkers>> = [];
  let homeStats: Awaited<ReturnType<typeof fetchHomeStats>> | null = null;

  try {
    markers = await fetchHomeProjectMarkers();
  } catch (error) {
    logOnce("home-markers", "Home globe: marker query failed", error);
  }

  try {
    grantMarkers = await fetchHomeGrantMarkers();
  } catch (error) {
    logOnce("home-grants", "Home globe: funding marker query failed", error);
  }

  try {
    issueMarkers = await fetchHomeWatchdogMarkers();
  } catch (error) {
    logOnce("home-issues", "Home globe: issue marker query failed", error);
  }

  try {
    homeStats = await fetchHomeStats();
  } catch (error) {
    logOnce("home-stats", "Home globe: stats query failed", error);
  }

  return (
    <main className="flex flex-col">
      {/* Full-viewport hero */}
      <Suspense fallback={<div className="h-[calc(100dvh-3.5rem)] w-full bg-soltas-light" />}>
        <HomeGlobeSection
          projectMarkers={markers}
          grantMarkers={grantMarkers}
          issueMarkers={issueMarkers}
          homeStats={homeStats}
        />
      </Suspense>

      {/* Below-the-fold content */}
      <div className="flex flex-col gap-8 px-4 py-8 sm:gap-12 sm:px-6 sm:py-10">
        <section
          id="home-next-section"
          className="grid gap-8 border-t border-soltas-light pt-8 sm:gap-10 sm:pt-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]"
        >
          <div className="space-y-6">
            <header className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-soltas-ocean">
                About Solarpunk Taskforce
              </p>
              <h2 className="text-2xl font-semibold text-soltas-text sm:text-3xl">
                Mission, vision, and community-powered action.
              </h2>
            </header>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-soltas-glacial bg-soltas-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-soltas-text">Mission</h3>
                <p className="mt-3 text-sm leading-6 text-soltas-muted">
                  Provide a transparent, living database of humanitarian and environmental work so organisations can
                  coordinate, apply proven solutions, and amplify what is working.
                </p>
              </div>
              <div className="rounded-3xl border border-soltas-glacial bg-soltas-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-soltas-text">Vision</h3>
                <p className="mt-3 text-sm leading-6 text-soltas-muted">
                  A complete, real-time overview of impact efforts empowers people everywhere to understand where help is
                  needed, follow progress, and move resources to trusted work.
                </p>
              </div>
            </div>
          </div>
          <div className="flex h-full flex-col justify-between gap-6 rounded-3xl bg-soltas-abyssal p-8 text-white shadow-lg">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-soltas-glacial">Donate</p>
              <h3 className="mt-3 text-2xl font-semibold">Fuel verified work on the ground.</h3>
              <p className="mt-3 text-sm leading-6 text-soltas-glacial/80">
                Every contribution supports approved projects and the teams that keep the map accurate, transparent, and
                community-driven.
              </p>
            </div>
            <Link
              href="/find-projects"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-soltas-ocean px-5 text-sm font-semibold text-white transition hover:bg-soltas-glacial focus:outline-none focus-visible:ring-2 focus-visible:ring-soltas-glacial"
            >
              Donate to a project
            </Link>
          </div>
        </section>

        <section className="space-y-8">
          <header className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-soltas-ocean">Our Services</p>
            <h2 className="text-2xl font-semibold text-soltas-text sm:text-3xl">Platform services for impact teams.</h2>
            <p className="max-w-2xl text-sm leading-6 text-soltas-muted">
              From discovery to verification, the Solarpunk Taskforce platform pairs data with storytelling to keep
              humanitarian and environmental work visible and trusted.
            </p>
          </header>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[
              {
                title: "Verified profiles",
                description: "Publish trusted organisation and project profiles with clear verification signals.",
              },
              {
                title: "Impact discovery",
                description: "Find projects, funding opportunities, and watchdog issues through a global map view.",
              },
              {
                title: "Progress updates",
                description: "Share updates, metrics, and media to keep donors and partners informed.",
              },
              {
                title: "Community intelligence",
                description: "Surface local issues and ensure they reach the right partners for action.",
              },
              {
                title: "Data-driven storytelling",
                description: "Turn factual data into narratives that increase awareness and trust.",
              },
              {
                title: "Partnership enablement",
                description: "Coordinate across organisations to reduce duplication and scale proven solutions.",
              },
            ].map((service) => (
              <div
                key={service.title}
                className="flex flex-col gap-3 rounded-3xl border border-soltas-glacial bg-soltas-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-soltas-text">{service.title}</h3>
                <p className="text-sm leading-6 text-soltas-muted">{service.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
