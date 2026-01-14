"use client";

import Link from "next/link";
import type { FocusEvent } from "react";
import { useMemo, useRef, useState } from "react";

import HomeGlobe, { type HomeGlobeMode, type HomeGlobePoint } from "@/components/home/HomeGlobe";
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

export default function HomeGlobeSection({
  projectMarkers,
  grantMarkers,
  issueMarkers,
}: {
  projectMarkers: ProjectMarker[];
  grantMarkers: GrantMarker[];
  issueMarkers: WatchdogIssueMarker[];
}) {
  const [mode, setMode] = useState<HomeGlobeMode>(DEFAULT_MODE);
  const buttonRowRef = useRef<HTMLDivElement | null>(null);

  const pointsByMode = useMemo<Record<HomeGlobeMode, HomeGlobePoint[]>>(
    () => ({
      projects: projectMarkers.map(marker => ({
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
      funding: grantMarkers.map(marker => ({
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
      issues: issueMarkers.map(marker => ({
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

  const handleRowBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextFocus = event.relatedTarget;
    if (!nextFocus || !buttonRowRef.current?.contains(nextFocus as Node)) {
      setMode(DEFAULT_MODE);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div
        ref={buttonRowRef}
        className="hidden flex-wrap gap-3 md:flex"
        onMouseLeave={() => setMode(DEFAULT_MODE)}
        onBlurCapture={handleRowBlur}
      >
        {(Object.keys(MODE_CONFIG) as HomeGlobeMode[]).map(key => {
          const item = MODE_CONFIG[key];
          const isActive = mode === key;
          return (
            <Link
              key={key}
              href={item.href}
              onMouseEnter={() => setMode(key)}
              onFocus={() => setMode(key)}
              className={cn(
                "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 py-2 font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                isActive
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "border border-slate-200 text-slate-900 hover:bg-slate-100",
              )}
              aria-current={isActive ? "true" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        <div
          className="grid grid-cols-3 rounded-2xl border border-slate-200 bg-white p-1"
          role="tablist"
          aria-label="Select globe preview mode"
        >
          {(Object.keys(MODE_CONFIG) as HomeGlobeMode[]).map(key => {
            const item = MODE_CONFIG[key];
            const isActive = mode === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className={cn(
                  "h-10 rounded-2xl text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                  isActive ? "bg-emerald-600 text-white" : "text-slate-700 hover:bg-slate-100",
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
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          Open {MODE_CONFIG[mode].mobileLabel}
        </Link>
      </div>

      <div id="home-globe" className="min-h-[60vh] flex-1">
        <HomeGlobe mode={mode} pointsByMode={pointsByMode} />
      </div>
    </div>
  );
}
