"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

  // Panel width in px. We’ll set an initial “~1/3” once we know container width.
  const [panelWidth, setPanelWidth] = useState<number>(360);

  const limits = useMemo(() => {
    // sensible defaults; also adapt max to container width below
    return { min: 280, max: 680 };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const applyDefault = () => {
      const w = el.getBoundingClientRect().width;
      if (!Number.isFinite(w) || w <= 0) return;
      // default: 1/3 of container width, clamped
      const max = Math.min(limits.max, Math.floor(w * 0.6)); // don’t let panel eat whole map
      const initial = clamp(Math.floor(w / 3), limits.min, max);
      setPanelWidth(initial);
    };

    applyDefault();

    const ro = new ResizeObserver(() => applyDefault());
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left; // new panel width
      const max = Math.min(limits.max, Math.floor(rect.width * 0.6));
      setPanelWidth(clamp(Math.floor(x), limits.min, max));
    };

    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [limits.max, limits.min]);

  const startDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    draggingRef.current = true;
    // capture pointer so dragging keeps working off the handle
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  return (
    <section
      ref={containerRef}
      className="grid gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      style={{
        gridTemplateColumns: `${panelWidth}px 10px 1fr`,
      }}
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
        type="button"
        aria-label="Resize panel"
        onPointerDown={startDrag}
        className="group relative flex h-full w-[10px] items-center justify-center bg-slate-50 hover:bg-slate-100"
      >
        <div className="h-16 w-[2px] rounded-full bg-slate-300 group-hover:bg-slate-400" />
      </button>

      {/* Map */}
      <div className="min-h-[520px] min-w-0 bg-white">
        <Map markers={markers} markerColor="#10b981" focusSlug={focusSlug} ctaLabel="See more" />
      </div>
    </section>
  );
}
