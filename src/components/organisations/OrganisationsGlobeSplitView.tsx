"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Map from "@/components/Map";
import OrganisationsFilters from "@/components/organisations/OrganisationsFilters";
import type {
  OrganisationFilterOptions,
  OrganisationMarker,
} from "@/lib/organisations/findOrganisationsQuery";

type Props = {
  options: OrganisationFilterOptions;
  markers: OrganisationMarker[];
  totalCount: number;
  focusSlug: string | null;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function OrganisationsGlobeSplitView({
  options,
  markers,
  totalCount,
  focusSlug,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const draggingRef = useRef(false);
  const dragPointerIdRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastClientXRef = useRef<number | null>(null);
  const initializedRef = useRef(false);

  const [panelWidth, setPanelWidth] = useState<number>(420);
  const [collapsed, setCollapsed] = useState(false);

  // Remember the last expanded width so we can restore it when reopening.
  const lastExpandedWidthRef = useRef<number>(420);

  const limits = useMemo(
    () => ({
      // prevents sidebar content from breaking/overlapping
      absoluteMin: 360,
      absoluteMax: 1200,
      handle: 28, // a bit wider to comfortably click + drag
    }),
    [],
  );

  const computeBounds = useCallback(
    (containerWidth: number) => {
      // Restrict to 1/4 .. 3/4 of available width
      const minByRatio = Math.floor(containerWidth * 0.25);
      const maxByRatio = Math.floor(containerWidth * 0.75);

      const min = Math.max(limits.absoluteMin, minByRatio);
      const max = Math.min(limits.absoluteMax, maxByRatio);

      const safeMax = Math.max(min, max);
      return { min, max: safeMax };
    },
    [limits.absoluteMax, limits.absoluteMin],
  );

  // Initialize width ONCE to ~1/3, then only clamp on container resizes.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const apply = () => {
      const w = el.getBoundingClientRect().width;
      if (!Number.isFinite(w) || w <= 0) return;

      const { min, max } = computeBounds(w);

      setPanelWidth((current) => {
        // If collapsed, keep it collapsed (no clamping needed).
        if (collapsed) return 0;

        if (!initializedRef.current) {
          initializedRef.current = true;
          const initial = clamp(Math.floor(w / 3), min, max);
          lastExpandedWidthRef.current = initial;
          return initial;
        }

        const next = clamp(current, min, max);
        lastExpandedWidthRef.current = next;
        return next;
      });
    };

    apply();
    const ro = new ResizeObserver(() => apply());
    ro.observe(el);
    return () => ro.disconnect();
  }, [computeBounds, collapsed]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      lastClientXRef.current = e.clientX;

      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;

        const el = containerRef.current;
        const x = lastClientXRef.current;
        if (!el || x == null) return;

        const rect = el.getBoundingClientRect();
        const raw = x - rect.left;

        const { min, max } = computeBounds(rect.width);

        // Dragging should automatically expand if currently collapsed.
        if (collapsed) {
          setCollapsed(false);
        }

        const next = clamp(Math.floor(raw), min, max);
        lastExpandedWidthRef.current = next;
        setPanelWidth(next);
      });
    };

    const stopDrag = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;

      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      const pointerId = dragPointerIdRef.current;
      dragPointerIdRef.current = null;

      const active = document.activeElement;
      if (pointerId != null && active instanceof HTMLElement && active.releasePointerCapture) {
        try {
          active.releasePointerCapture(pointerId);
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [computeBounds, collapsed]);

  const startDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    draggingRef.current = true;
    dragPointerIdRef.current = e.pointerId;

    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus();

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    // If collapsed, start by reopening to minimum width immediately (feels better).
    if (collapsed) {
      const el = containerRef.current;
      if (el) {
        const { min, max } = computeBounds(el.getBoundingClientRect().width);
        const restored = clamp(lastExpandedWidthRef.current || min, min, max);
        setCollapsed(false);
        setPanelWidth(restored);
        lastExpandedWidthRef.current = restored;
      } else {
        setCollapsed(false);
      }
    }
  };

  const toggleCollapsed = () => {
    const el = containerRef.current;

    if (!collapsed) {
      // collapsing: remember current width
      if (panelWidth > 0) lastExpandedWidthRef.current = panelWidth;
      setCollapsed(true);
      setPanelWidth(0);
      return;
    }

    // expanding: restore last width (clamped)
    if (el) {
      const { min, max } = computeBounds(el.getBoundingClientRect().width);
      const restored = clamp(lastExpandedWidthRef.current || Math.floor(el.getBoundingClientRect().width / 3), min, max);
      setCollapsed(false);
      setPanelWidth(restored);
      lastExpandedWidthRef.current = restored;
    } else {
      setCollapsed(false);
      setPanelWidth(lastExpandedWidthRef.current || limits.absoluteMin);
    }
  };

  return (
    <section
      ref={containerRef}
      className="h-full w-full min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div
        className="grid h-full w-full"
        style={{ gridTemplateColumns: `${panelWidth}px ${limits.handle}px 1fr` }}
      >
        {/* Left panel */}
        <div
          className={[
            "min-w-0 h-full border-r border-slate-200 bg-white transition-[width] duration-150",
            collapsed ? "pointer-events-none opacity-0" : "opacity-100",
          ].join(" ")}
          aria-hidden={collapsed ? "true" : "false"}
        >
          <div className="h-full overflow-y-auto p-4">
            <div className="space-y-4">
              <OrganisationsFilters options={options} />
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {markers.length} organisations mapped · {totalCount} total matching filters
              </div>
            </div>
          </div>
        </div>

        {/* Handle column: drag + toggle */}
        <div className="relative h-full w-full bg-slate-50">
          {/* Drag target (full height) */}
          <button
            type="button"
            aria-label="Resize panel"
            onPointerDown={startDrag}
            className="absolute inset-0 h-full w-full hover:bg-slate-100 active:bg-slate-100 focus:outline-none"
          >
            <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-slate-200" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none">
              <div className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
                {"<>"}
              </div>
            </div>
          </button>

          {/* Collapse/expand button (sits above drag layer) */}
          <button
            type="button"
            aria-label={collapsed ? "Open filters panel" : "Close filters panel"}
            onClick={toggleCollapsed}
            className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-white p-1.5 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
          >
            <span className="text-xs font-semibold text-slate-700">
              {collapsed ? "›" : "‹"}
            </span>
          </button>
        </div>

        {/* Map */}
        <div className="min-w-0 h-full">
          <Map markers={markers} markerColor="#10b981" focusSlug={focusSlug} ctaLabel="See more" />
        </div>
      </div>
    </section>
  );
}
