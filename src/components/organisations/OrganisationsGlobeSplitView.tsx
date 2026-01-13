"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

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
  const handleRef = useRef<HTMLButtonElement | null>(null);

  const draggingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastClientXRef = useRef<number | null>(null);
  const initializedRef = useRef(false);

  // Panel width in px.
  const [panelWidth, setPanelWidth] = useState<number>(360);

  const limits = useMemo(() => ({ min: 300, hardMax: 760 }), []);

  // Compute max based on container width (so panel can’t eat the entire map).
  const computeMax = (containerWidth: number) => {
    // allow up to 60% of container width, but cap to hardMax
    return Math.min(limits.hardMax, Math.floor(containerWidth * 0.6));
  };

  // Initialize width ONCE to ~1/3 of container, then only clamp on future resizes.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const apply = () => {
      const w = el.getBoundingClientRect().width;
      if (!Number.isFinite(w) || w <= 0) return;

      const max = computeMax(w);

      setPanelWidth((current) => {
        // First time: set to 1/3 of container
        if (!initializedRef.current) {
          initializedRef.current = true;
          const initial = clamp(Math.floor(w / 3), limits.min, max);
          return initial;
        }
        // After init: only clamp (do NOT reset), to avoid “snap back” jitter.
        return clamp(current, limits.min, max);
      });
    };

    apply();

    const ro = new ResizeObserver(() => apply());
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      lastClientXRef.current = e.clientX;

      // Throttle to animation frames for smoothness.
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;

        const el = containerRef.current;
        const x = lastClientXRef.current;
        if (!el || x == null) return;

        const rect = el.getBoundingClientRect();
        const raw = x - rect.left;

        const max = computeMax(rect.width);
        setPanelWidth(clamp(Math.floor(raw), limits.min, max));
      });
    };

    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;

      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      // release pointer capture if we still have it
      const handle = handleRef.current;
      if (handle) {
        try {
          // no-op if not captured
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          handle.releasePointerCapture?.(1 as any);
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [limits.min]);

  const startDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    draggingRef.current = true;
    handleRef.current = e.currentTarget;

    // Capture pointer so it keeps tracking even if cursor leaves the handle.
    e.currentTarget.setPointerCapture(e.pointerId);

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  return (
    <section
      ref={containerRef}
      className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div
        className="grid h-full w-full"
        style={{ gridTemplateColumns: `${panelWidth}px 12px 1fr` }}
      >
        {/* Left panel */}
        <div className="min-w-0 border-r border-slate-200 bg-white">
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
          ref={handleRef}
          type="button"
          aria-label="Resize panel"
          onPointerDown={startDrag}
          className="group relative h-full w-[12px] bg-slate-50 hover:bg-slate-100 active:bg-slate-100"
        >
          {/* Center grip */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none">
            <div className="flex flex-col items-center gap-2">
              <div className="h-24 w-[2px] rounded-full bg-slate-300 group-hover:bg-slate-400" />
              {/* Drag hint icon */}
              <div className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200">
                {"<>"}
              </div>
            </div>
          </div>
        </button>

        {/* Map */}
        <div className="min-w-0">
          <div className="h-full w-full">
            <Map
              markers={markers}
              markerColor="#10b981"
              focusSlug={focusSlug}
              ctaLabel="See more"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
