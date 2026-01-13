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

  const limits = useMemo(
    () => ({
      // prevents sidebar content from breaking/overlapping
      absoluteMin: 360,
      absoluteMax: 1100,
      handle: 24,
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

      // Ensure max never dips below min (very small screens)
      return { min: Math.min(min, max), max };
    },
    [limits.absoluteMax, limits.absoluteMin],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const apply = () => {
      const w = el.getBoundingClientRect().width;
      if (!Number.isFinite(w) || w <= 0) return;

      const { min, max } = computeBounds(w);

      setPanelWidth((current) => {
        if (!initializedRef.current) {
          initializedRef.current = true;
          const initial = clamp(Math.floor(w / 3), min, max); // initial = ~1/3
          return initial;
        }
        // clamp only (no reset) so dragging never snaps back
        return clamp(current, min, max);
      });
    };

    apply();

    const ro = new ResizeObserver(() => apply());
    ro.observe(el);
    return () => ro.disconnect();
  }, [computeBounds]);

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
        setPanelWidth(clamp(Math.floor(raw), min, max));
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
  }, [computeBounds]);

  const startDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    draggingRef.current = true;
    dragPointerIdRef.current = e.pointerId;

    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus();

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
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
        <div className="min-w-0 h-full border-r border-slate-200 bg-white">
          <div className="h-full overflow-y-auto p-4">
            <div className="space-y-4">
              <OrganisationsFilters options={options} />
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {markers.length} organisations mapped · {totalCount} total matching filters
              </div>
            </div>
          </div>
        </div>

        {/* Drag handle */}
        <button
          type="button"
          aria-label="Resize panel"
          onPointerDown={startDrag}
          className="relative h-full w-full bg-slate-50 hover:bg-slate-100 active:bg-slate-100 focus:outline-none"
        >
          <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-slate-200" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
              {"<>"}
            </div>
          </div>
        </button>

        {/* Map */}
        <div className="min-w-0 h-full">
          <Map markers={markers} markerColor="#10b981" focusSlug={focusSlug} ctaLabel="See more" />
        </div>
      </div>
    </section>
  );
}
