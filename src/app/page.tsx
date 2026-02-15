import Link from "next/link";
import { Suspense } from "react";

import HomeGlobeSection from "@/components/home/HomeGlobeSection";

export default function HomePage() {
  return (
    <main className="flex flex-col">
      {/* Full-viewport hero */}
      <Suspense fallback={<div className="h-[calc(100dvh-3.5rem)] w-full bg-soltas-light" />}>
        {/* Let HomeGlobeSection fetch what it needs client-side */}
        <HomeGlobeSection />
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
                A unifying force in the global impact movement
              </h2>
            </header>
            <p className="text-sm leading-7 text-soltas-muted">
              Solarpunk Taskforce connects people, projects, and organisations to improve the
              coordination and effectiveness of global humanitarian and environmental impact.
              By bridging the gap between action and awareness through transparent communication
              and creative media, we empower a global community to engage meaningfully with impact.
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-soltas-glacial bg-soltas-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-soltas-text">Mission</h3>
                <p className="mt-3 text-sm leading-6 text-soltas-muted">
                  For organisations: provide a transparent, living database to enable cooperation,
                  reduce redundant resource allocation, and improve communication. For individuals:
                  bridge action and awareness with creative, transparent content that empowers
                  meaningful engagement.
                </p>
              </div>
              <div className="rounded-3xl border border-soltas-glacial bg-soltas-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-soltas-text">Vision</h3>
                <p className="mt-3 text-sm leading-6 text-soltas-muted">
                  A world where organisations have a real-time overview of global efforts enabling
                  synergy and cooperation, individuals can transparently see where support goes,
                  and creative content restores trust in humanitarian work.
                </p>
              </div>
            </div>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-sm font-semibold text-soltas-ocean transition hover:underline"
            >
              Learn more about Solarpunk Taskforce →
            </Link>
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
            <h2 className="text-2xl font-semibold text-soltas-text sm:text-3xl">Supporting impact organisations</h2>
            <p className="max-w-2xl text-sm leading-6 text-soltas-muted">
              We offer comparative intelligence consulting and marketing services to help registered projects
              and organisations maximize their impact, visibility, and strategic positioning in the humanitarian
              and environmental sectors.
            </p>
          </header>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[
              {
                title: "Comparative Intelligence",
                description:
                  "Data-driven insights leveraging our global database to identify collaboration opportunities, proven solutions, and strategic positioning.",
              },
              {
                title: "Project Marketing",
                description:
                  "Creative storytelling and strategic marketing to increase visibility, build trust, and drive engagement for your initiatives.",
              },
              {
                title: "Verified Profiles",
                description: "Publish trusted organisation and project profiles with clear verification signals.",
              },
              {
                title: "Impact Discovery",
                description: "Find projects, funding opportunities, and watchdog issues through a global map view.",
              },
              {
                title: "Progress Updates",
                description: "Share updates, metrics, and media to keep donors and partners informed.",
              },
              {
                title: "Community Intelligence",
                description: "Surface local issues and ensure they reach the right partners for action.",
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
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm font-semibold text-soltas-ocean transition hover:underline"
          >
            Explore all services →
          </Link>
        </section>
      </div>
    </main>
  );
}
