"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import type { FocusEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Rnd } from "react-rnd";

import HomeGlobe, { type HomeGlobeMode, type HomeGlobePoint } from "@/components/home/HomeGlobe";
import type { HomeStats } from "@/lib/homeStats";
import { cn } from "@/lib/utils";
import type { GrantMarker } from "@/lib/grants/findGrantsQuery";
import type { ProjectMarker } from "@/lib/projects/findProjectsQuery";
import type { WatchdogIssueMarker } from "@/lib/watchdog/findWatchdogIssuesQuery";

const DEFAULT_MODE: HomeGlobeMode = "projects";
const STATS_LAYOUT_STORAGE_KEY = "home-globe-panel-layout-v2";

type PanelKey = "left" | "right";
type PanelLayout = { x: number; y: number; width: number; height: number };
type PanelLayoutMap = Record<PanelKey, PanelLayout>;

const PANEL_MIN_WIDTH = 280;
const PANEL_MAX_WIDTH = 560;
const PANEL_MIN_HEIGHT = 200;
const PANEL_MAX_HEIGHT = 400;
const PANEL_PADDING_X = 48;
const PANEL_PADDING_BOTTOM = 32;
const PANEL_DEFAULT_WIDTH = 380;
const PANEL_DEFAULT_HEIGHT = 240;

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

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getDefaultLayout = (containerWidth: number, containerHeight: number): PanelLayoutMap => {
  const width = clamp(PANEL_DEFAULT_WIDTH, PANEL_MIN_WIDTH, Math.min(PANEL_MAX_WIDTH, containerWidth));
  const height = clamp(PANEL_DEFAULT_HEIGHT, PANEL_MIN_HEIGHT, Math.min(PANEL_MAX_HEIGHT, containerHeight));
  return {
    left: {
      x: clamp(PANEL_PADDING_X, 0, Math.max(0, containerWidth - width)),
      y: clamp(containerHeight - height - PANEL_PADDING_BOTTOM, 0, Math.max(0, containerHeight - height)),
      width,
      height,
    },
    right: {
      x: clamp(containerWidth - width - PANEL_PADDING_X, 0, Math.max(0, containerWidth - width)),
      y: clamp(containerHeight - height - PANEL_PADDING_BOTTOM, 0, Math.max(0, containerHeight - height)),
      width,
      height,
    },
  };
};

const clampPanel = (panel: PanelLayout, containerWidth: number, containerHeight: number): PanelLayout => {
  const maxWidth = Math.max(PANEL_MIN_WIDTH, Math.min(PANEL_MAX_WIDTH, containerWidth));
  const maxHeight = Math.max(PANEL_MIN_HEIGHT, Math.min(PANEL_MAX_HEIGHT, containerHeight));
  const width = clamp(panel.width, PANEL_MIN_WIDTH, maxWidth);
  const height = clamp(panel.height, PANEL_MIN_HEIGHT, maxHeight);
  return {
    width,
    height,
    x: clamp(panel.x, 0, Math.max(0, containerWidth - width)),
    y: clamp(panel.y, 0, Math.max(0, containerHeight - height)),
  };
};

const normalizeLayout = (layout: PanelLayoutMap, containerWidth: number, containerHeight: number): PanelLayoutMap => {
  const left = clampPanel(layout.left, containerWidth, containerHeight);
  const right = clampPanel(layout.right, containerWidth, containerHeight);
  return { left, right };
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
  const [panelLayout, setPanelLayout] = useState<PanelLayoutMap | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const buttonRowRef = useRef<HTMLDivElement | null>(null);
  const statsContainerRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const node = statsContainerRef.current;
    if (!node) return;

    const updateSize = () => {
      setContainerSize({ width: node.clientWidth, height: node.clientHeight });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!containerSize.width || !containerSize.height) return;

    const defaults = getDefaultLayout(containerSize.width, containerSize.height);
    let nextLayout = defaults;

    const savedLayout = localStorage.getItem(STATS_LAYOUT_STORAGE_KEY);
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout) as Partial<PanelLayoutMap>;
        if (parsed.left && parsed.right) {
          nextLayout = {
            left: {
              x: Number(parsed.left.x),
              y: Number(parsed.left.y),
              width: Number(parsed.left.width),
              height: Number(parsed.left.height),
            },
            right: {
              x: Number(parsed.right.x),
              y: Number(parsed.right.y),
              width: Number(parsed.right.width),
              height: Number(parsed.right.height),
            },
          };
        }
      } catch {
        nextLayout = defaults;
      }
    }

    setPanelLayout(normalizeLayout(nextLayout, containerSize.width, containerSize.height));
  }, [containerSize.height, containerSize.width]);

  useEffect(() => {
    if (!panelLayout) return;
    localStorage.setItem(STATS_LAYOUT_STORAGE_KEY, JSON.stringify(panelLayout));
  }, [panelLayout]);

  const handleRowBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextFocus = event.relatedTarget;
    if (!nextFocus || !buttonRowRef.current?.contains(nextFocus as Node)) {
      setMode(DEFAULT_MODE);
    }
  };

  // Both panels always stay the same size — mirror new dimensions to both,
  // but keep each panel anchored to its default x/y position.
  const onPanelResizeStop = useCallback(
    (
      _panelKey: PanelKey,
      _event: MouseEvent | TouchEvent,
      _direction: string,
      ref: HTMLElement,
      _delta: unknown,
      _position: { x: number; y: number },
    ) => {
      const newWidth = ref.offsetWidth;
      const newHeight = ref.offsetHeight;
      setPanelLayout((_current) => {
        if (!containerSize.width || !containerSize.height) return _current;
        const defaults = getDefaultLayout(containerSize.width, containerSize.height);
        return normalizeLayout(
          {
            left: { ...defaults.left, width: newWidth, height: newHeight },
            right: { ...defaults.right, width: newWidth, height: newHeight },
          },
          containerSize.width,
          containerSize.height,
        );
      });
    },
    [containerSize.height, containerSize.width],
  );

  const scrollToNextSection = useCallback(() => {
    const next = document.getElementById("home-next-section");
    next?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <section className="relative h-[calc(100dvh-3.5rem)] w-full overflow-hidden">
      {/* Globe background */}
      <div id="home-globe" className="absolute inset-0 z-0">
        <HomeGlobe mode={mode} pointsByMode={pointsByMode} />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-slate-950/30 via-slate-950/10 to-slate-950/40" />
      </div>

      {/* Overlay UI (IMPORTANT: allow globe interaction by default) */}
      <div className="pointer-events-none relative z-10 flex h-full w-full flex-col">
        {/* Top content */}
        <div className="px-6 pt-8 sm:px-8 lg:px-12">
          {/* Intro copy */}
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Solarpunk Taskforce</p>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Discover regenerative projects around the globe.</h1>
            <p className="text-base text-white/80">
              Explore approved community projects, funding opportunities, and watchdog issues from the Solarpunk
              Taskforce ecosystem.
            </p>
          </div>

          {/* Buttons (re-enable pointer events) */}
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
        <div ref={statsContainerRef} className="relative flex-1">
          {panelLayout ? (
            <>
              <DraggableStatsPanel
                panelKey="left"
                title={activeStats.leftTitle}
                items={activeStats.left}
                footnote={activeStats.footnote}
                layout={panelLayout.left}
                onResizeStop={onPanelResizeStop}
              />
              <DraggableStatsPanel
                panelKey="right"
                title={activeStats.rightTitle}
                items={activeStats.right}
                footnote={activeStats.footnote}
                align="right"
                layout={panelLayout.right}
                onResizeStop={onPanelResizeStop}
              />
            </>
          ) : null}

          {/* Mobile snapshot (shown below lg) */}
          <div className="pointer-events-auto absolute inset-x-0 bottom-0 px-6 pb-6 sm:px-8 lg:hidden lg:px-12">
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
              className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-slate-950/35 text-white/90 backdrop-blur-md transition hover:bg-slate-950/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              <ChevronDown className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── DraggableStatsPanel ────────────────────────────────────────────────────
// Panels are fixed in place. Only the single corner facing the globe
// (top-right for left panel, top-left for right panel) is resizeable.
// Resizing one panel mirrors the new size to both panels simultaneously.

function DraggableStatsPanel({
  panelKey,
  title,
  items,
  footnote,
  align,
  layout,
  onResizeStop,
}: {
  panelKey: PanelKey;
  title: string;
  items: StatItem[];
  footnote?: string;
  align?: "left" | "right";
  layout: PanelLayout;
  onResizeStop: (
    panelKey: PanelKey,
    event: MouseEvent | TouchEvent,
    direction: string,
    ref: HTMLElement,
    delta: unknown,
    position: { x: number; y: number },
  ) => void;
}) {
  // Left panel sits on the left edge → its globe-facing corner is top-right.
  // Right panel sits on the right edge → its globe-facing corner is top-left.
  const enableResizing = {
    top: false,
    right: false,
    bottom: false,
    left: false,
    topRight: panelKey === "left",
    bottomRight: false,
    bottomLeft: false,
    topLeft: panelKey === "right",
  };

  const cornerStyle = { width: "20px", height: "20px", opacity: 1, zIndex: 20 };

  return (
    <Rnd
      className="pointer-events-auto z-10 hidden lg:block"
      disableDragging
      bounds="parent"
      size={{ width: layout.width, height: layout.height }}
      position={{ x: layout.x, y: layout.y }}
      minWidth={PANEL_MIN_WIDTH}
      maxWidth={PANEL_MAX_WIDTH}
      minHeight={PANEL_MIN_HEIGHT}
      maxHeight={PANEL_MAX_HEIGHT}
      onResizeStop={(event, direction, ref, delta, position) =>
        onResizeStop(panelKey, event, direction, ref, delta, position)
      }
      enableResizing={enableResizing}
      resizeHandleStyles={{
        topRight: cornerStyle,
        topLeft: cornerStyle,
      }}
      resizeHandleClasses={{
        topRight: "home-panel-resize-handle",
        topLeft: "home-panel-resize-handle",
      }}
    >
      <HomeStatsPanel title={title} items={items} footnote={footnote} align={align} panelSize={layout} />
    </Rnd>
  );
}

// ─── HomeStatsPanel ─────────────────────────────────────────────────────────
// Renders the frosted-glass card. Text scales proportionally with panel width.

function HomeStatsPanel({
  title,
  items,
  footnote,
  align = "left",
  panelSize,
}: {
  title: string;
  items: StatItem[];
  footnote?: string;
  align?: "left" | "right";
  panelSize?: PanelLayout;
}) {
  if (!items.length) return null;

  // Scale relative to default width, clamped between 75% and 140%.
  const scale = panelSize
    ? clamp(panelSize.width / PANEL_DEFAULT_WIDTH, 0.75, 1.4)
    : 1;

  return (
    <div
      className={cn(
        "group relative flex h-full w-full flex-col gap-4 overflow-hidden rounded-3xl border border-white/25 bg-white/10 p-5 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.55)] backdrop-blur-xl motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:duration-500 motion-reduce:animate-none",
        align === "right" ? "lg:text-right" : "lg:text-left",
      )}
    >
      {/* Header row */}
      <div
        className="flex items-center justify-between gap-2 font-semibold uppercase tracking-[0.2em] text-emerald-100"
        style={{ fontSize: `${0.75 * scale}rem` }}
      >
        <span>{title}</span>
        <span className="hidden items-center gap-1 text-white/70 lg:inline-flex">
          <span>Live aggregates</span>
        </span>
      </div>

      {/* Stat rows */}
      <div className="grid gap-4">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col items-start gap-1">
            <div
              className="font-semibold text-white/85"
              style={{ fontSize: `${0.875 * scale}rem` }}
            >
              {item.label}
            </div>
            <div
              className="font-semibold text-white"
              style={{ fontSize: `${2 * scale}rem`, lineHeight: 1.1 }}
            >
              {formatStatValue(item)}
            </div>
          </div>
        ))}
      </div>

      {/* Footnote */}
      {footnote ? (
        <p className="text-white/70" style={{ fontSize: `${0.75 * scale}rem` }}>
          {footnote}
        </p>
      ) : null}

      {/* Hover ring */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-transparent transition group-hover:ring-white/25 group-focus-within:ring-white/25" />
    </div>
  );
}