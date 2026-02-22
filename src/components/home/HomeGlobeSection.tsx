"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import type { FocusEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import HomeGlobe, { type HomeGlobeMode, type HomeGlobePoint } from "@/components/home/HomeGlobe";
import type { GrantMarker } from "@/lib/grants/findGrantsQuery";
import type { HomeStats } from "@/lib/homeStats";
import type { ProjectMarker } from "@/lib/projects/findProjectsQuery";
import { cn } from "@/lib/utils";
import type { WatchdogIssueMarker } from "@/lib/watchdog/findWatchdogIssuesQuery";

const DEFAULT_MODE: HomeGlobeMode = "projects";
const STATS_SIZE_STORAGE_KEY = "home-globe-panel-size-v4";

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

// Keep the rectangle a rectangle during resize (constant aspect ratio).
const PANEL_ASPECT = PANEL_DEFAULT_WIDTH / PANEL_DEFAULT_HEIGHT;

const MODE_CONFIG: Record<HomeGlobeMode, { label: string; href: string; ctaLabel: string; mobileLabel: string }> = {
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

/**
 * Clamp scale based on width/height min/max simultaneously while keeping aspect ratio.
 * We treat scale relative to start width/height, then clamp to what both dimensions allow.
 */
const clampScale = (scale: number, start: { w: number; h: number }) => {
  const minScale = Math.max(PANEL_MIN_WIDTH / start.w, PANEL_MIN_HEIGHT / start.h);
  const maxScale = Math.min(PANEL_MAX_WIDTH / start.w, PANEL_MAX_HEIGHT / start.h);
  return clamp(scale, minScale, maxScale);
};

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
  const [isLoading, setIsLoading] = useState(projectMarkers.length === 0 && grantMarkers.length === 0 && issueMarkers.length === 0);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setIsLoading(true);

      try {
        const [markersRes, statsRes] = await Promise.all([fetch("/api/home-markers"), fetch("/api/home-stats")]);

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
        if (isActive) setIsLoading(false);
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
    Record<HomeGlobeMode, { leftTitle: string; rightTitle: string; left: StatItem[]; right: StatItem[]; footnote: string }>
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
          { label: "Verified organisations", value: homeStatsState?.projects.organisations_registered, format: "number" },
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
        right: [{ label: "Funders represented", value: homeStatsState?.funding.funders_registered, format: "number" }],
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
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Discover regenerative projects around the globe.</h1>
            <p className="text-base text-white/80">
              Explore approved community projects, funding opportunities, and watchdog issues from the Solarpunk Taskforce ecosystem.
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

        {/* Desktop stat panels */}
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
      <div className="pointer-events-none absolute hidden lg:block" style={{ left: PANEL_PADDING_X, bottom: PANEL_PADDING_BOTTOM }}>
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

      <div className="pointer-events-none absolute hidden lg:block" style={{ right: PANEL_PADDING_X, bottom: PANEL_PADDING_BOTTOM }}>
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

/**
 * PinnedStatsPanel
 * - Proportional diagonal scaling (always keeps the same aspect ratio)
 * - rAF-throttled setState for smoothness
 * - Text scales during drag via transform (cheap)
 * - A more intuitive resize handle + hint
 */
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
  const onResizeRef = useRef(onResize);
  useEffect(() => {
    onResizeRef.current = onResize;
  }, [onResize]);

  const sizeRef = useRef(size);
  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  // Snapshot on drag start.
  const dragStartRef = useRef<{ px: number; py: number; w: number; h: number } | null>(null);

  // rAF throttle: at most 1 setState per frame.
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<PanelSize | null>(null);

  const flushResize = useCallback(() => {
    rafRef.current = null;
    const next = pendingRef.current;
    if (!next) return;
    onResizeRef.current(next);
    pendingRef.current = null;
  }, []);

  const scheduleResize = useCallback(
    (next: PanelSize) => {
      pendingRef.current = next;
      if (rafRef.current == null) {
        rafRef.current = window.requestAnimationFrame(flushResize);
      }
    },
    [flushResize],
  );

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      pendingRef.current = null;
    };
  }, []);

  const setDraggingCursor = (isDragging: boolean) => {
    const root = document.documentElement;
    if (isDragging) {
      root.style.cursor = "nwse-resize";
      root.style.userSelect = "none";
    } else {
      root.style.cursor = "";
      root.style.userSelect = "";
    }
  };

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const current = sizeRef.current;
      dragStartRef.current = { px: e.clientX, py: e.clientY, w: current.width, h: current.height };

      setDraggingCursor(true);

      const handlePointerMove = (ev: PointerEvent) => {
        const start = dragStartRef.current;
        if (!start) return;

        const dx = ev.clientX - start.px;
        const dy = ev.clientY - start.py;

        // Growth direction:
        // Left panel grows when moving right/up. Right grows when moving left/up.
        const signedDx = panelKey === "left" ? dx : -dx;
        const signedDy = -dy; // up = positive

        // Dominant intent by movement magnitude avoids "sticky" shrink.
        const useX = Math.abs(signedDx) >= Math.abs(signedDy);

        // Scale factor from dominant axis
        let nextScale = useX ? 1 + signedDx / start.w : 1 + signedDy / start.h;
        if (!Number.isFinite(nextScale)) nextScale = 1;

        nextScale = clampScale(nextScale, start);

        // Maintain aspect ratio exactly.
        const nextWidth = Math.round(start.w * nextScale);
        const nextHeight = Math.round(nextWidth / PANEL_ASPECT);

        // Ensure height bounds are respected too (rare edge when width clamp hits first).
        const clamped = clampSize({ width: nextWidth, height: nextHeight });

        // Re-derive width from height if height got clamped.
        const finalWidth = Math.round(clamped.height * PANEL_ASPECT);
        scheduleResize(clampSize({ width: finalWidth, height: clamped.height }));
      };

      const endDrag = () => {
        dragStartRef.current = null;
        setDraggingCursor(false);
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", endDrag);
        window.removeEventListener("pointercancel", endDrag);
      };

      window.addEventListener("pointermove", handlePointerMove, { passive: true });
      window.addEventListener("pointerup", endDrag, { passive: true });
      window.addEventListener("pointercancel", endDrag, { passive: true });
    },
    [panelKey, scheduleResize],
  );

  // Content scale (live during drag). Clamp to avoid too tiny / too huge.
  const dimensionScale = Math.min(size.width / PANEL_DEFAULT_WIDTH, size.height / PANEL_DEFAULT_HEIGHT);
  const contentScale = clamp(dimensionScale, 0.82, 1.28);

  const cornerClass = panelKey === "left" ? "-top-2 -right-2" : "-top-2 -left-2";
  const transformOrigin = align === "right" ? "top right" : "top left";

  if (!items.length) return null;

  return (
    <div
      className={cn(
        "pointer-events-auto group relative overflow-hidden rounded-3xl border border-white/25 bg-white/10",
        "shadow-[0_20px_60px_-30px_rgba(15,23,42,0.55)] backdrop-blur-xl",
        "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:duration-500 motion-reduce:animate-none",
      )}
      style={{ width: size.width, height: size.height }}
    >
      {/* Subtle glow on hover for "premium" feel */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
        <div className="absolute -inset-10 bg-radial from-white/10 via-transparent to-transparent" />
      </div>

      {/* Content (scaled live) */}
      <div
        className={cn("h-full w-full will-change-transform", align === "right" ? "text-right" : "text-left")}
        style={{ transform: `scale(${contentScale})`, transformOrigin }}
      >
        <div className={cn("flex h-full w-full flex-col", align === "right" ? "items-end" : "items-start", "p-4")}
          style={{ gap: 14 }}
        >
          {/* Header */}
          <div className="flex w-full items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-soltas-glacial">
            <span>{title}</span>
            <span className="text-white/50">Live aggregates</span>
          </div>

          {/* Stats */}
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div key={item.label} className={cn("flex flex-col gap-0.5", align === "right" ? "items-end" : "items-start")}>
                <div className="text-xs font-medium text-white/75">{item.label}</div>
                <div className="text-3xl font-semibold leading-none text-white">{formatStatValue(item)}</div>
              </div>
            ))}
          </div>

          {/* Footnote */}
          {footnote ? <p className="mt-auto text-xs text-white/50">{footnote}</p> : null}
        </div>
      </div>

      {/* Improved corner resize handle */}
      <button
        type="button"
        aria-label="Resize panel"
        onPointerDown={onPointerDown}
        className={cn(
          "absolute z-20",
          cornerClass,
          // Big invisible hit target (easy to grab)
          "h-11 w-11 rounded-2xl",
          // Visible handle “capsule” sits inside
          "flex items-center justify-center",
          "cursor-nwse-resize",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-soltas-ocean",
        )}
      >
        {/* Visible handle */}
        <span
          className={cn(
            "relative flex h-9 w-9 items-center justify-center rounded-2xl",
            "border border-white/15 bg-white/10 backdrop-blur-md",
            "shadow-[0_18px_50px_-26px_rgba(15,23,42,0.9)]",
            "transition duration-200",
            "group-hover:scale-[1.06] group-hover:border-white/30 group-hover:bg-white/14",
            "active:scale-[0.98]",
          )}
        >
          {/* Corner cue: a little “L” corner + grip dots */}
          <span className="pointer-events-none absolute inset-0 rounded-2xl">
            <span className={cn(
              "absolute bottom-2 right-2 h-4 w-4 rounded-sm",
              "border-b border-r border-white/55",
              "opacity-70 group-hover:opacity-95 transition",
            )} />
          </span>

          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-white/70 transition group-hover:text-white"
            aria-hidden="true"
          >
            {/* diagonal arrows */}
            <path d="M6 10 L10 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M10 6 H7.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M10 6 V8.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M10 6 L12.2 3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>

        {/* Hover hint */}
        <span
          className={cn(
            "pointer-events-none absolute -top-10 left-1/2 hidden -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-semibold",
            "border border-white/20 bg-slate-950/55 text-white/85 backdrop-blur-md shadow-sm",
            "opacity-0 translate-y-1 transition duration-200",
            "lg:block group-hover:opacity-100 group-hover:translate-y-0",
          )}
        >
          Drag to resize
        </span>
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
        "relative flex flex-col gap-3 overflow-hidden rounded-3xl border border-white/25 bg-white/10 p-4",
        "shadow-[0_20px_60px_-30px_rgba(15,23,42,0.55)] backdrop-blur-xl",
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