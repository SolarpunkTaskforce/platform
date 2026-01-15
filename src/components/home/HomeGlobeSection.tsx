"use client";

import Link from "next/link";
import type { FocusEvent } from "react";
import { useMemo, useRef, useState } from "react";

import HomeGlobe, { type HomeGlobeMode, type HomeGlobePoint } from "@/components/home/HomeGlobe";
import type { HomeStats } from "@/lib/homeStats";
import { cn } from "@/lib/utils";
import type { GrantMarker } from "@/lib/grants/findGrantsQuery";
import type { ProjectMarker } from "@/lib/projects/findProjectsQuery";
import type { WatchdogIssueMarker } from "@/lib/watchdog/findWatchdogIssuesQuery";

const DEFAULT_MODE: HomeGlobeMode = "projects";

const MODE_CONFIG: Record<
  HomeGlobeMode,
  { label: string; href: string; ctaLabel: string; mobileLabel: string }
> = {
  projects: {
    label: "Find Projects",
    href: "/find-projects",
    ctaLabel: "Open project",
    mobileLabel: "Projects",
  },
  funding: {
    label: "Find Funding",
    href: "/funding",
    ctaLabel: "Open funding",
    mobileLabel: "Funding",
  },
  issues: {
    label: "Find Issues",
    href: "/watchdog",
    ctaLabel: "Open issue",
    mobileLabel: "Issues",
  },
};

const formatPlace = (parts: Array<string | null | undefined>) => {
  const filtered = parts.filter(Boolean) as string[];
  return filtered.length ? filtered.join(", ") : null;
};

const formatUrgency = (urgency: number | null | undefined) => {
  if (!urgency) return null;
  return `Urgency ${urgency}`;
};

type StatItem = {
  label: string;
  value?: number;
  format: "number" | "currency";
};

const numberFormatter = new Intl.NumberFormat("en-US");
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const formatStatValue = (item: StatItem) => {
  if (typeof item.value !== "number" || Number.isNaN(item.value)) {
    return "—";
  }
  if (item.format === "currency") {
    return currencyFormatter.format(item.value);
  }
  return numberFormatter.format(item.value);
};

export default function HomeGlobeSection({
  projectMarkers,
  grantMarkers,
  issueMarkers,
  homeStats,
}: {
  projectMarkers: ProjectMarker[];
  grantMarkers: GrantMarker[];
  issueMarkers: WatchdogIssueMarker[];
  homeStats: HomeStats | null;
}) {
  const [mode, setMode] = useState<HomeGlobeMode>(DEFAULT_MODE);
  const buttonRowRef = useRef<HTMLDivElement | null>(null);

  const pointsByMode = useMemo<Record<HomeGlobeMode, HomeGlobePoint[]>>(
    () => ({
      projects: projectMarkers.map((marker) => ({
        id: marker.id,
        lng: typeof marker.lng === "number" ? marker.lng : Number.NaN,
        lat: typeof marker.lat === "number" ? marker.lat : Number.NaN,
        title: marker.name ?? "Untitled project",
        placeName: marker.place_name,
        description: marker.description,
        markerColor: marker.category === "humanitarian" ? "#7f1d1d" : "#064e3b",
        ctaHref: `/projects/${marker.slug ?? marker.id}`,
        ctaLabel: MODE_CONFIG.projects.ctaLabel,
        eyebrow: "Project",
        meta: marker.category ? marker.category.replace(/_/g, " ") : null,
      })),
      funding: grantMarkers.map((marker) => ({
        id: marker.id,
        lng: typeof marker.longitude === "number" ? marker.longitude : Number.NaN,
        lat: typeof marker.latitude === "number" ? marker.latitude : Number.NaN,
        title: marker.title ?? "Untitled funding",
        placeName: marker.location_name,
        description: marker.summary,
        markerColor:
          marker.project_type === "humanitarian"
            ? "#7f1d1d"
            : marker.project_type === "environmental"
              ? "#064e3b"
              : marker.project_type === "both"
                ? "#1e3a8a"
                : "#10b981",
        ctaHref: `/funding/${encodeURIComponent(marker.slug ?? marker.id)}`,
        ctaLabel: MODE_CONFIG.funding.ctaLabel,
        eyebrow: "Funding",
        meta: marker.project_type ? `Type: ${marker.project_type}` : null,
      })),
      issues: issueMarkers.map((marker) => ({
        id: marker.id,
        lng: typeof marker.longitude === "number" ? marker.longitude : Number.NaN,
        lat: typeof marker.latitude === "number" ? marker.latitude : Number.NaN,
        title: marker.title ?? "Untitled issue",
        placeName: formatPlace([marker.city, marker.region, marker.country]),
        description: marker.description,
        markerColor:
          marker.urgency && marker.urgency >= 4
            ? "#ef4444"
            : marker.urgency === 3
              ? "#f97316"
              : marker.urgency === 2
                ? "#f59e0b"
                : marker.urgency === 1
                  ? "#84cc16"
                  : "#22c55e",
        ctaHref: `/watchdog?view=table&focus=${marker.id}`,
        ctaLabel: MODE_CONFIG.issues.ctaLabel,
        eyebrow: "Watchdog issue",
        meta: formatUrgency(marker.urgency ?? null),
      })),
    }),
    [grantMarkers, issueMarkers, projectMarkers],
  );

  const statsByMode = useMemo<
    Record<
      HomeGlobeMode,
      { leftTitle: string; rightTitle: string; left: StatItem[]; right: StatItem[]; footnote: string }
    >
  >(
    () => ({
      projects: {
        leftTitle: "Project momentum",
        rightTitle: "Community impact",
        left: [
          { label: "Approved projects", value: homeStats?.projects.projects_approved, format: "number" },
          { label: "Ongoing projects", value: homeStats?.projects.projects_ongoing, format: "number" },
        ],
        right: [
          { label: "Verified organisations", value: homeStats?.projects.organisations_registered, format: "number" },
          { label: "Donations received", value: homeStats?.projects.donations_received_eur, format: "currency" },
        ],
        footnote: "Totals reflect approved public projects and verified organisations.",
      },
      funding: {
        leftTitle: "Funding flow",
        rightTitle: "Funder network",
        left: [
          { label: "Funding opportunities", value: homeStats?.funding.opportunities_total, format: "number" },
          { label: "Open calls", value: homeStats?.funding.open_calls, format: "number" },
        ],
        right: [{ label: "Funders represented", value: homeStats?.funding.funders_registered, format: "number" }],
        footnote: "Counts include published funding calls that are open or rolling.",
      },
      issues: {
        leftTitle: "Issue visibility",
        rightTitle: "Urgency signals",
        left: [{ label: "Approved issues", value: homeStats?.issues.issues_total, format: "number" }],
        right: [{ label: "High-urgency alerts", value: homeStats?.issues.issues_open, format: "number" }],
        footnote: "High-urgency alerts are approved issues marked 4+ on urgency.",
      },
    }),
    [homeStats],
  );

  const activeStats = statsByMode[mode];

  const handleRowBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextFocus = event.relatedTarget;
    if (!nextFocus || !buttonRowRef.current?.contains(nextFocus as Node)) {
      setMode(DEFAULT_MODE);
    }
  };

  return (
    <section className="relative -mx-6 h-[calc(100vh-3.5rem)] w-screen overflow-hidden">
      {/* Globe background */}
      <div id="home-globe" className="absolute inset-0 z-0">
        <HomeGlobe mode={mode} pointsByMode={pointsByMode} />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-slate-950/30 via-slate-950/10 to-slate-950/40" />
      </div>

      {/* Overlay UI (IMPORTANT: allow globe interaction by default) */}
      <div className="pointer-events-none relative z-10 flex h-full w-full flex-col">
        {/* Top content */}
        <div className="px-6 sm:px-8 lg:px-12 pt-8">
          {/* Intro copy */}
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
              Solarpunk Taskforce
            </p>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">
              Discover regenerative projects around the globe.
            </h1>
            <p className="text-base text-white/80">
              Explore approved community projects, funding opportunities, and watchdog issues from the Solarpunk
              Taskforce ecosystem.
            </p>
          </div>

          {/* Buttons (re-enable pointer events) */}
          <div className="mt-6 pointer-events-auto">
            <div
              ref={buttonRowRef}
              className="hidden flex-wrap gap-3 md:flex"
              onMouseLeave={() => setMode(DEFAULT_MODE)}
              onBlurCapture={handleRowBlur}
            >
              {(Object.keys(MODE_CONFIG) as HomeGlobeMode[]).map((key) => {
                const item = MODE_CONFIG[key];
                const isActive = mode === key;
                return (
                  <Link
                    key={key}
                    href={item.href}
                    onMouseEnter={() => setMode(key)}
                    onFocus={() => setMode(key)}
                    className={cn(
                      "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 py-2 font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
                      isActive
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "border border-white/25 bg-white/10 text-white backdrop-blur-md hover:bg-white/15",
                    )}
                    aria-current={isActive ? "true" : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-4 flex flex-col gap-3 md:hidden">
              <div
                className="grid grid-cols-3 rounded-2xl border border-white/25 bg-white/10 p-1 backdrop-blur-md"
                role="tablist"
                aria-label="Select globe preview mode"
                aria-orientation="horizontal"
              >
                {(Object.keys(MODE_CONFIG) as HomeGlobeMode[]).map((key) => {
                  const item = MODE_CONFIG[key];
                  const isActive = mode === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setMode(key)}
                      className={cn(
                        "h-10 rounded-2xl text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
                        isActive ? "bg-emerald-600 text-white" : "text-white/90 hover:bg-white/10",
                      )}
                      role="tab"
                      aria-selected={isActive}
                      aria-controls="home-globe"
                    >
                      {item.mobileLabel}
                    </button>
                  );
                })}
              </div>

              <Link
                href={MODE_CONFIG[mode].href}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                Open {MODE_CONFIG[mode].mobileLabel}
              </Link>
            </div>
          </div>
        </div>

        {/* Stats overlays */}
        <div className="relative flex-1">
          <div className="absolute inset-0 flex items-end justify-between gap-6 px-6 sm:px-8 lg:px-12 pb-8">
            <div className="pointer-events-auto hidden w-[min(420px,34vw)] lg:block">
              <HomeStatsPanel
                key={`${mode}-left`}
                title={activeStats.leftTitle}
                items={activeStats.left}
                footnote={activeStats.footnote}
              />
            </div>

            <div className="pointer-events-auto hidden w-[min(420px,34vw)] lg:block">
              <HomeStatsPanel
                key={`${mode}-right`}
                title={activeStats.rightTitle}
                items={activeStats.right}
                footnote={activeStats.footnote}
                align="right"
              />
            </div>
          </div>

          <div className="pointer-events-auto absolute inset-x-0 bottom-0 px-6 sm:px-8 lg:px-12 pb-6 lg:hidden">
            <div className="grid gap-4 md:grid-cols-2">
              <HomeStatsPanel key={`${mode}-snapshot-left`} title="Snapshot" items={activeStats.left} />
              <HomeStatsPanel key={`${mode}-snapshot-right`} title="Snapshot" items={activeStats.right} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeStatsPanel({
  title,
  items,
  footnote,
  align = "left",
}: {
  title: string;
  items: StatItem[];
  footnote?: string;
  align?: "left" | "right";
}) {
  if (!items.length) return null;

  return (
    <div
      className={cn(
        "relative flex flex-col gap-4 rounded-3xl border border-white/25 bg-white/10 p-5 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.55)] backdrop-blur-xl motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:duration-500 motion-reduce:animate-none",
        align === "right" ? "lg:text-right" : "lg:text-left",
      )}
    >
      <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
        <span>{title}</span>
        <span className="hidden text-white/70 lg:inline">Live aggregates</span>
      </div>
      <div className="grid gap-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-baseline justify-between gap-4">
            <div className="text-sm font-semibold text-white/85">{item.label}</div>
            <div className="text-2xl font-semibold text-white sm:text-3xl">
              {formatStatValue(item)}
            </div>
          </div>
        ))}
      </div>
      {footnote ? <p className="text-xs text-white/70">{footnote}</p> : null}
    </div>
  );
}
