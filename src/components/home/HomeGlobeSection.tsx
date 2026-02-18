"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import type { FocusEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import HomeGlobe, { type HomeGlobeMode, type HomeGlobePoint } from "@/components/home/HomeGlobe";
import type { HomeStats } from "@/lib/homeStats";
import { cn } from "@/lib/utils";
import type { GrantMarker } from "@/lib/grants/findGrantsQuery";
import type { ProjectMarker } from "@/lib/projects/findProjectsQuery";
import type { WatchdogIssueMarker } from "@/lib/watchdog/findWatchdogIssuesQuery";

const DEFAULT_MODE: HomeGlobeMode = "projects";
const STATS_SIZE_STORAGE_KEY = "home-globe-panel-size-v3";

type PanelKey = "left" | "right";
type PanelSize = { width: number; height: number };

const PANEL_MIN_WIDTH = 300;
const PANEL_MAX_WIDTH = 560;
const PANEL_MIN_HEIGHT = 200;
const PANEL_MAX_HEIGHT = 420;
const PANEL_DEFAULT_WIDTH = 340;
const PANEL_DEFAULT_HEIGHT = 220;
const PANEL_PADDING_X = 32;
const PANEL_PADDING_BOTTOM = 32;

const MODE_CONFIG: Record<
  HomeGlobeMode,
  { label: string; href: string; ctaLabel: string; mobileLabel: string }
> = {
  projects: {
    label: "Find Projects",
    href: "/projects",
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
  if (typeof item.value !== "number" || Number.isNaN(item.value)) return "—";
  if (item.format === "currency") return currencyFormatter.format(item.value);
  return numberFormatter.format(item.value);
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const defaultSize = (): PanelSize => ({
  width: PANEL_DEFAULT_WIDTH,
  height: PANEL_DEFAULT_HEIGHT,
});

const clampSize = (s: PanelSize): PanelSize => ({
  width: clamp(s.width, PANEL_MIN_WIDTH, PANEL_MAX_WIDTH),
  height: clamp(s.height, PANEL_MIN_HEIGHT, PANEL_MAX_HEIGHT),
});

type Props = {
  projectMarkers?: ProjectMarker[];
  grantMarkers?: GrantMarker[];
  issueMarkers?: WatchdogIssueMarker[];
  homeStats?: HomeStats | null;
};

// ─── Main section ────────────────────────────────────────────────────────────

export default function HomeGlobeSection({
  projectMarkers = [],
  grantMarkers = [],
  issueMarkers = [],
  homeStats = null,
}: Props) {
  const [projectMarkersState, setProjectMarkersState] = useState<ProjectMarker[]>(projectMarkers);
  const [grantMarkersState, setGrantMarkersState] = useState<GrantMarker[]>(grantMarkers);
  const [issueMarkersState, setIssueMarkersState] = useState<WatchdogIssueMarker[]>(issueMarkers);
  const [homeStatsState, setHomeStatsState] = useState<HomeStats | null>(homeStats);
  const [isLoading, setIsLoading] = useState(
    projectMarkers.length === 0 &&
    grantMarkers.length === 0 &&
    issueMarkers.length === 0
  );


  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setIsLoading(true);

      try {
        const [markersRes, statsRes] = await Promise.all([
          fetch("/api/home-markers"),
          fetch("/api/home-stats"),
        ]);


        if (!isActive) return;

        if (markersRes.ok) {
          const markers = (await markersRes.json()) as {
            projectMarkers?: ProjectMarker[];
            grantMarkers?: GrantMarker[];
            issueMarkers?: WatchdogIssueMarker[];
          };

          setProjectMarkersState(markers.projectMarkers ?? []);
          setGrantMarkersState(markers.grantMarkers ?? []);
          setIssueMarkersState(markers.issueMarkers ?? []);
        }

        if (statsRes.ok) {
          const stats = (await statsRes.json()) as HomeStats;
          setHomeStatsState(stats);
        }
      } catch {
        // keep initial values as fallback
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, []);

  const [mode, setMode] = useState<HomeGlobeMode>(DEFAULT_MODE);
  const buttonRowRef = useRef<HTMLDivElement | null>(null);

  const pointsByMode = useMemo<Record<HomeGlobeMode, HomeGlobePoint[]>>(
    () => ({
      projects: projectMarkersState.map((marker) => ({
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
      funding: grantMarkersState.map((marker) => ({
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
      issues: issueMarkersState.map((marker) => ({
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
    [grantMarkersState, issueMarkersState, projectMarkersState],
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
          { label: "Approved projects", value: homeStatsState?.projects.projects_approved, format: "number" },
          { label: "Ongoing projects", value: homeStatsState?.projects.projects_ongoing, format: "number" },
        ],
        right: [
          {
            label: "Verified organisations",
            value: homeStatsState?.projects.organisations_registered,
            format: "number",
          },
          { label: "Donations received", value: homeStatsState?.projects.donations_received_eur, format: "currency" },
        ],
        footnote: "Totals reflect approved public projects and verified organisations.",
      },
      funding: {
        leftTitle: "Funding flow",
        rightTitle: "Funder network",
        left: [
          { label: "Funding opportunities", value: homeStatsState?.funding.opportunities_total, format: "number" },
          { label: "Open calls", value: homeStatsState?.funding.open_calls, format: "number" },
        ],
        right: [
          { label: "Funders represented", value: homeStatsState?.funding.funders_registered, format: "number" },
        ],
        footnote: "Counts include published funding calls that are open or rolling.",
      },
      issues: {
        leftTitle: "Issue visibility",
        rightTitle: "Urgency signals",
        left: [{ label: "Approved issues", value: homeStatsState?.issues.issues_total, format: "number" }],
        right: [{ label: "High-urgency alerts", value: homeStatsState?.issues.issues_open, format: "number" }],
        footnote: "High-urgency alerts are approved issues marked 4+ on urgency.",
      },
    }),
    [homeStatsState],
  );

  const activeStats = statsByMode[mode];

  const handleRowBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextFocus = event.relatedTarget;
    if (!nextFocus || !buttonRowRef.current?.contains(nextFocus as Node)) {
      setMode(DEFAULT_MODE);
    }
  };

  const scrollToNextSection = useCallback(() => {
    const next = document.getElementById("home-next-section");
    next?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <section className="relative h-[calc(100dvh-4rem)] w-full overflow-hidden">
      {/* Globe background */}
      <div id="home-globe" className="absolute inset-0 z-0">
        <HomeGlobe mode={mode} pointsByMode={pointsByMode} />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-slate-950/30 via-slate-950/10 to-slate-950/40" />
      </div>

      {/* Overlay UI */}
      <div className="pointer-events-none relative z-10 flex h-full w-full flex-col">
        {/* Top content */}
        <div className="px-6 pt-8 sm:px-8 lg:px-12">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-soltas-glacial">Solarpunk Taskforce</p>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">
              Discover regenerative projects around the globe.
            </h1>
            <p className="text-base text-white/80">
              Explore approved community projects, funding opportunities, and watchdog issues from the Solarpunk
              Taskforce ecosystem.
            </p>
            {isLoading ? <p className="text-sm text-white/70">Loading live globe data…</p> : null}
          </div>

          {/* Mode buttons */}
          <div className="pointer-events-auto mt-6">
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
                      "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 py-2 font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-soltas-ocean",
                      isActive
                        ? "bg-soltas-ocean text-white hover:bg-soltas-abyssal"
                        : "border border-white/25 bg-white/10 text-white backdrop-blur-md hover:bg-white/15",
                    )}
                    aria-current={isActive ? "true" : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Mobile tab bar */}
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
                        "h-10 rounded-2xl text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-soltas-ocean",
                        isActive ? "bg-soltas-ocean text-white" : "text-white/90 hover:bg-white/10",
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
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-soltas-ocean"
              >
                Open {MODE_CONFIG[mode].mobileLabel}
              </Link>
            </div>
          </div>
        </div>

        {/* ── Desktop stat panels — pinned to bottom corners ── */}

        <PinnedStatsPanels activeStats={activeStats} />

        {/* Mobile snapshot */}
        <div className="pointer-events-auto absolute inset-x-0 bottom-0 px-6 pb-6 sm:px-8 lg:hidden">
          <div className="grid gap-4 md:grid-cols-2">
            <HomeStatsPanel key={`${mode}-snapshot-left`} title="Snapshot" items={activeStats.left} />
            <HomeStatsPanel key={`${mode}-snapshot-right`} title="Snapshot" items={activeStats.right} />
          </div>
        </div>

        {/* Scroll chevron */}
        <div className="pointer-events-none absolute inset-x-0 bottom-5 z-20 flex justify-center">
          <button
            type="button"
            onClick={scrollToNextSection}
            aria-label="Scroll to next section"
            className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-soltas-peat/35 text-white/90 backdrop-blur-md transition hover:bg-soltas-peat/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-soltas-glacial"
          >
            <ChevronDown className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

type ActiveStats = {
  leftTitle: string;
  rightTitle: string;
  left: StatItem[];
  right: StatItem[];
  footnote?: string;
};

function PinnedStatsPanels({ activeStats }: { activeStats: ActiveStats }) {
  const [panelSize, setPanelSize] = useState<PanelSize>(() => {
    if (typeof window === "undefined") return defaultSize();
    try {
      const saved = localStorage.getItem(STATS_SIZE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<PanelSize>;
        if (typeof parsed.width === "number" && typeof parsed.height === "number") {
          return clampSize({ width: parsed.width, height: parsed.height });
        }
      }
    } catch {
      // ignore
    }
    return defaultSize();
  });

  useEffect(() => {
    try {
      localStorage.setItem(STATS_SIZE_STORAGE_KEY, JSON.stringify(panelSize));
    } catch {
      // ignore
    }
  }, [panelSize]);

  return (
    <>
      <div
        className="pointer-events-none absolute hidden lg:block"
        style={{ left: PANEL_PADDING_X, bottom: PANEL_PADDING_BOTTOM }}
      >
        <PinnedStatsPanel
          panelKey="left"
          title={activeStats.leftTitle}
          items={activeStats.left}
          footnote={activeStats.footnote}
          align="left"
          size={panelSize}
          onResize={setPanelSize}
        />
      </div>

      <div
        className="pointer-events-none absolute hidden lg:block"
        style={{ right: PANEL_PADDING_X, bottom: PANEL_PADDING_BOTTOM }}
      >
        <PinnedStatsPanel
          panelKey="right"
          title={activeStats.rightTitle}
          items={activeStats.right}
          footnote={activeStats.footnote}
          align="right"
          size={panelSize}
          onResize={setPanelSize}
        />
      </div>
    </>
  );
}

// ─── PinnedStatsPanel ─────────────────────────────────────────────────────────
// Positioned with CSS (bottom + left/right), never moves.
// Resize is handled by a raw pointermove listener on the corner handle so that
// both panels mirror each other live — every frame while dragging.

function PinnedStatsPanel({
  panelKey,
  title,
  items,
  footnote,
  align,
  size,
  onResize,
}: {
  panelKey: PanelKey;
  title: string;
  items: StatItem[];
  footnote?: string;
  align: "left" | "right";
  size: PanelSize;
  onResize: (s: PanelSize) => void;
}) {
  // Keep a stable ref to onResize so the pointermove closure never stales.
  const onResizeRef = useRef(onResize);
  useEffect(() => { onResizeRef.current = onResize; }, [onResize]);

  // Capture start position and panel size at drag start.
  const dragStartRef = useRef<{ px: number; py: number; w: number; h: number } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dragStartRef.current = { px: e.clientX, py: e.clientY, w: size.width, h: size.height };
      e.currentTarget.setPointerCapture(e.pointerId);
      document.body.style.cursor = "nwse-resize";
      document.body.style.userSelect = "none";
    },
    [size],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!dragStartRef.current) return;
      const { px, py, w, h } = dragStartRef.current;
      const dx = e.clientX - px;
      const dy = e.clientY - py;

      // Left panel: drag right/up to grow. Right panel: drag left/up to grow.
      const signedDx = panelKey === "left" ? dx : -dx;
      const signedDy = -dy; // up = positive

      const newWidth = clamp(w + signedDx, PANEL_MIN_WIDTH, PANEL_MAX_WIDTH);
      const newHeight = clamp(h + signedDy, PANEL_MIN_HEIGHT, PANEL_MAX_HEIGHT);

      onResizeRef.current({ width: newWidth, height: newHeight });
    },
    [panelKey],
  );

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    dragStartRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  // Scale text proportionally to the tighter dimension, clamped for legibility.
  const dimensionScale = Math.min(size.width / PANEL_DEFAULT_WIDTH, size.height / PANEL_DEFAULT_HEIGHT);
  const scale = clamp(dimensionScale, 0.7, 1.35);
  const contentPadding = 18 + 6 * scale;
  const contentGap = 12 + 6 * scale;
  const statsGap = 10 + 5 * scale;

  // Corner handle sits at the globe-facing corner.
  const cornerClass = panelKey === "left" ? "-top-1.5 -right-1.5" : "-top-1.5 -left-1.5";

  if (!items.length) return null;

  return (
    <div
      className="pointer-events-auto group relative overflow-hidden rounded-3xl border border-white/25 bg-white/10 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.55)] backdrop-blur-xl motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:duration-500 motion-reduce:animate-none"
      style={{ width: size.width, height: size.height }}
    >
      {/* Content */}
      <div
        className={cn(
          "flex h-full w-full flex-col",
          align === "right" ? "items-end text-right" : "items-start text-left",
        )}
        style={{ gap: `${contentGap}px`, padding: `${contentPadding}px` }}
      >
        {/* Header */}
        <div
          className="flex w-full items-center justify-between gap-2 font-semibold uppercase tracking-[0.2em] text-soltas-glacial"
          style={{ fontSize: `${0.7 * scale}rem` }}
        >
          <span>{title}</span>
          <span className="text-white/50">Live aggregates</span>
        </div>

        {/* Stats */}
        <div className="flex flex-col" style={{ gap: `${statsGap}px` }}>
          {items.map((item) => (
            <div
              key={item.label}
              className={cn("flex flex-col gap-0.5", align === "right" ? "items-end" : "items-start")}
            >
              <div className="font-medium text-white/75" style={{ fontSize: `${0.8 * scale}rem` }}>
                {item.label}
              </div>
              <div
                className="font-semibold leading-none text-white"
                style={{ fontSize: `${1.9 * scale}rem` }}
              >
                {formatStatValue(item)}
              </div>
            </div>
          ))}
        </div>

        {/* Footnote */}
        {footnote ? (
          <p className="mt-auto text-white/50" style={{ fontSize: `${0.68 * scale}rem` }}>
            {footnote}
          </p>
        ) : null}
      </div>

      {/* Corner resize handle */}
      <button
        type="button"
        aria-label="Resize panel"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={cn(
          "group/handle absolute z-20 flex h-6 w-6 items-center justify-center rounded-xl",
          "border border-white/15 bg-white/12 backdrop-blur-sm shadow-[0_10px_40px_-20px_rgba(15,23,42,0.8)]",
          "transition hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/18",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-soltas-ocean",
          "cursor-nwse-resize",
          cornerClass,
        )}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className="text-white/60 transition group-hover/handle:text-white"
          aria-hidden="true"
        >
          <path d="M3 9.5 9.5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M6.2 9.5 9.5 6.2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      </button>

      {/* Hover ring */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-transparent transition group-hover:ring-white/20" />
    </div>
  );
}

// ─── HomeStatsPanel (mobile only) ────────────────────────────────────────────

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
        "relative flex flex-col gap-3 overflow-hidden rounded-3xl border border-white/25 bg-white/10 p-4 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.55)] backdrop-blur-xl",
        align === "right" ? "items-end text-right" : "items-start text-left",
      )}
    >
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-soltas-glacial">{title}</div>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-0.5">
            <div className="text-xs font-medium text-white/75">{item.label}</div>
            <div className="text-2xl font-semibold leading-none text-white">{formatStatValue(item)}</div>
          </div>
        ))}
      </div>
      {footnote ? <p className="text-xs text-white/50">{footnote}</p> : null}
    </div>
  );
}
