"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useSearchParams } from "next/navigation";

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const HAS_MAPBOX_TOKEN = typeof MAPBOX_TOKEN === "string" && MAPBOX_TOKEN.length > 0;
mapboxgl.accessToken = MAPBOX_TOKEN || "";

const ROTATION_SPEED_DEG_PER_SEC = 1.25;
const MIN_SWITCH_MS = 10000;
const POPUP_CHECK_INTERVAL_MS = 1500;
const INTERACTION_COOLDOWN_MS = 25000;
const FEATURED_REPEAT_BLOCK_MINUTES = 10;
const FEATURED_REPEAT_BLOCK_MS = FEATURED_REPEAT_BLOCK_MINUTES * 60 * 1000;
const IN_VIEW_THRESHOLD = 0.3;

export type HomeGlobeMode = "projects" | "funding" | "issues";

export type HomeGlobePoint = {
  id: string;
  lng: number;
  lat: number;
  title: string;
  placeName?: string | null;
  description?: string | null;
  markerColor?: string;
  ctaHref: string;
  ctaLabel: string;
  eyebrow?: string;
  meta?: string | null;
  isVerified?: boolean | null;
  isApproved?: boolean | null;
  verifiedAt?: string | number | Date | null;
  approvedAt?: string | number | Date | null;
  updatedAt?: string | number | Date | null;
  hasMedia?: boolean | null;
  mediaUrls?: string[] | null;
  mediaCount?: number | null;
};

type MarkerObject = {
  marker: mapboxgl.Marker;
  id: string;
  lng: number;
  lat: number;
  point: HomeGlobePoint;
};

const truncate = (value: string, length = 140) =>
  value.length > length ? `${value.slice(0, length).trimEnd()}…` : value;

const toRadians = (value: number) => (value * Math.PI) / 180;

const toUnitVector = (lng: number, lat: number) => {
  const phi = toRadians(lat);
  const theta = toRadians(lng);
  const cosPhi = Math.cos(phi);
  return {
    x: cosPhi * Math.cos(theta),
    y: Math.sin(phi),
    z: cosPhi * Math.sin(theta),
  };
};

const toTimestamp = (value: string | number | Date | null | undefined) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isFinite(value.valueOf()) ? value.valueOf() : null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const scoreFeaturedCandidate = (point: HomeGlobePoint, now: number) => {
  let score = 1;
  const isVerified = point.isVerified ?? Boolean(point.verifiedAt);
  const isApproved = point.isApproved ?? Boolean(point.approvedAt);
  const hasMedia =
    point.hasMedia ??
    (typeof point.mediaCount === "number" ? point.mediaCount > 0 : null) ??
    (Array.isArray(point.mediaUrls) ? point.mediaUrls.length > 0 : null) ??
    false;

  if (isVerified) score += 3;
  if (isApproved) score += 2;
  if (hasMedia) score += 2;

  const updatedAt = toTimestamp(point.updatedAt);
  if (updatedAt) {
    const ageDays = (now - updatedAt) / (1000 * 60 * 60 * 24);
    if (ageDays <= 1) score += 3;
    else if (ageDays <= 7) score += 2;
    else if (ageDays <= 30) score += 1;
  }

  return score;
};

const pickWeightedCandidate = (candidates: MarkerObject[], now: number) => {
  const weighted = candidates.map(candidate => ({
    candidate,
    weight: scoreFeaturedCandidate(candidate.point, now),
  }));
  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return null;
  let threshold = Math.random() * totalWeight;
  for (const item of weighted) {
    threshold -= item.weight;
    if (threshold <= 0) return item.candidate;
  }
  return weighted[weighted.length - 1]?.candidate ?? null;
};

const isMarkerInView = (marker: MarkerObject, center: mapboxgl.LngLat) => {
  const a = toUnitVector(marker.lng, marker.lat);
  const b = toUnitVector(center.lng, center.lat);
  const dot = a.x * b.x + a.y * b.y + a.z * b.z;
  return dot > IN_VIEW_THRESHOLD;
};

const FEATURED_COPY: Record<HomeGlobeMode, { title: string; description: string }> = {
  projects: {
    title: "Featured projects",
    description: "The globe highlights approved projects as they rotate into view.",
  },
  funding: {
    title: "Featured funding",
    description: "Highlighted funding opportunities refresh as the globe spins.",
  },
  issues: {
    title: "Featured issues",
    description: "Reviewed watchdog issues surface as they rotate into view.",
  },
};

export default function HomeGlobe({
  mode,
  pointsByMode,
}: {
  mode: HomeGlobeMode;
  pointsByMode: Record<HomeGlobeMode, HomeGlobePoint[]>;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerObjs = useRef<MarkerObject[]>([]);
  const activeMarkerRef = useRef<MarkerObject | null>(null);
  const recentIdsRef = useRef<Record<HomeGlobeMode, Array<{ id: string; timestamp: number }>>>({
    projects: [],
    funding: [],
    issues: [],
  });
  const lastSwitchRef = useRef<number>(0);
  const rotationFrameRef = useRef<number | null>(null);
  const lastRotationTimeRef = useRef<number | null>(null);
  const userInteractedRef = useRef(false);
  const userInteractTimerRef = useRef<number | null>(null);
  const lastInteractionRef = useRef<number>(0);
  const hasLoggedErrorRef = useRef(false);
  const [debugState, setDebugState] = useState<{ mode: HomeGlobeMode; featuredId?: string | null } | null>(
    null,
  );

  const debugEnabled =
    searchParams?.get("globeDebug") === "1" || searchParams?.get("globe_debug") === "1";

  const mapMarkers = useMemo(() => pointsByMode[mode] ?? [], [mode, pointsByMode]);

  const markInteracted = useCallback(() => {
    userInteractedRef.current = true;
    lastInteractionRef.current = Date.now();
    if (userInteractTimerRef.current != null) {
      window.clearTimeout(userInteractTimerRef.current);
    }
    userInteractTimerRef.current = window.setTimeout(() => {
      userInteractedRef.current = false;
      userInteractTimerRef.current = null;
    }, 2500);
  }, []);

  useEffect(() => {
    if (!HAS_MAPBOX_TOKEN) return;
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [0, 0],
      zoom: 1.15,
      projection: { name: "globe" },
      preserveDrawingBuffer: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");

    map.on("style.load", () => {
      map.setFog({
        color: "rgb(236, 253, 245)",
        "high-color": "rgb(13, 148, 136)",
        "space-color": "rgb(15, 23, 42)",
        "horizon-blend": 0.2,
      });
    });

    const handleMapError = (event: mapboxgl.ErrorEvent) => {
      if (hasLoggedErrorRef.current) return;
      hasLoggedErrorRef.current = true;
      console.error("Home globe: map error", event?.error ?? event);
    };

    map.on("dragstart", markInteracted);
    map.on("zoomstart", markInteracted);
    map.on("rotatestart", markInteracted);
    map.on("pitchstart", markInteracted);
    map.on("click", markInteracted);
    map.on("error", handleMapError);

    mapRef.current = map;

    return () => {
      if (userInteractTimerRef.current != null) window.clearTimeout(userInteractTimerRef.current);
      map.off("error", handleMapError);
      map.remove();
      mapRef.current = null;
    };
  }, [markInteracted]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markerObjs.current.forEach(obj => obj.marker.remove());
    markerObjs.current = [];
    activeMarkerRef.current = null;

    mapMarkers.forEach(marker => {
      if (!Number.isFinite(marker.lng) || !Number.isFinite(marker.lat)) return;

      const popup = new mapboxgl.Popup({ offset: 12, maxWidth: "320px", closeButton: false });
      const popupNode = document.createElement("div");
      popupNode.className =
        "space-y-2 text-sm text-slate-700 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300 motion-reduce:animate-none";

      if (marker.eyebrow) {
        const eyebrowEl = document.createElement("p");
        eyebrowEl.className = "text-xs font-semibold uppercase tracking-wide text-emerald-700";
        eyebrowEl.textContent = marker.eyebrow;
        popupNode.appendChild(eyebrowEl);
      }

      const titleEl = document.createElement("h3");
      titleEl.className = "text-base font-semibold text-slate-900";
      titleEl.textContent = marker.title;
      popupNode.appendChild(titleEl);

      if (marker.placeName) {
        const placeEl = document.createElement("p");
        placeEl.className = "text-xs uppercase tracking-wide text-slate-500";
        placeEl.textContent = marker.placeName;
        popupNode.appendChild(placeEl);
      }

      if (marker.meta) {
        const metaEl = document.createElement("p");
        metaEl.className = "text-xs font-medium text-slate-500";
        metaEl.textContent = marker.meta;
        popupNode.appendChild(metaEl);
      }

      if (marker.description) {
        const descriptionEl = document.createElement("p");
        descriptionEl.className = "text-sm leading-snug text-slate-600";
        descriptionEl.textContent = truncate(marker.description);
        popupNode.appendChild(descriptionEl);
      }

      const cta = document.createElement("a");
      cta.href = marker.ctaHref;
      cta.className =
        "mt-2 inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800";
      cta.textContent = marker.ctaLabel;
      popupNode.appendChild(cta);

      popup.setDOMContent(popupNode);

      const el = document.createElement("div");
      Object.assign(el.style, {
        width: "14px",
        height: "14px",
        borderRadius: "9999px",
        backgroundColor: marker.markerColor ?? "#10b981",
        boxShadow: "0 4px 12px rgba(15, 23, 42, 0.35)",
        transform: "translate(-50%, -50%)",
      });

      const mapMarker = new mapboxgl.Marker({ element: el })
        .setLngLat([marker.lng, marker.lat])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener("click", markInteracted);
      popup.on("close", markInteracted);

      markerObjs.current.push({
        marker: mapMarker,
        id: marker.id,
        lng: marker.lng,
        lat: marker.lat,
        point: marker,
      });
    });
  }, [mapMarkers, markInteracted]);

  useEffect(() => {
    const current = activeMarkerRef.current;
    if (current) {
      current.marker.getPopup()?.remove();
      activeMarkerRef.current = null;
    }
    lastSwitchRef.current = 0;
    if (debugEnabled) {
      setDebugState({ mode, featuredId: null });
    }
  }, [debugEnabled, mode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || reducedMotion) return;

    const animate = (time: number) => {
      if (lastRotationTimeRef.current == null) {
        lastRotationTimeRef.current = time;
      }
      const last = lastRotationTimeRef.current;
      const delta = (time - last) / 1000;
      lastRotationTimeRef.current = time;

      if (!userInteractedRef.current) {
        const nextBearing = map.getBearing() + ROTATION_SPEED_DEG_PER_SEC * delta;
        map.setBearing(nextBearing % 360);
      }

      rotationFrameRef.current = window.requestAnimationFrame(animate);
    };

    rotationFrameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (rotationFrameRef.current != null) {
        window.cancelAnimationFrame(rotationFrameRef.current);
        rotationFrameRef.current = null;
      }
      lastRotationTimeRef.current = null;
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const map = mapRef.current;
    if (!map) return;

    const pickFeatured = () => {
      const now = Date.now();
      const current = activeMarkerRef.current;
      const center = map.getCenter();

      if (now - lastInteractionRef.current < INTERACTION_COOLDOWN_MS) {
        return;
      }

      if (current && isMarkerInView(current, center)) {
        return;
      }

      if (current) {
        current.marker.getPopup()?.remove();
        activeMarkerRef.current = null;
      }

      if (now - lastSwitchRef.current < MIN_SWITCH_MS) return;

      const candidates = markerObjs.current.filter(marker => isMarkerInView(marker, center));
      if (!candidates.length) return;

      const recentEntries = recentIdsRef.current[mode] ?? [];
      const recent = new Set(
        recentEntries
          .filter(entry => now - entry.timestamp < FEATURED_REPEAT_BLOCK_MS)
          .map(entry => entry.id),
      );
      const fresh = candidates.filter(marker => !recent.has(marker.id));
      if (!fresh.length) return;

      const choice = pickWeightedCandidate(fresh, now);
      if (!choice) return;

      choice.marker.getPopup()?.addTo(map);
      activeMarkerRef.current = choice;
      lastSwitchRef.current = now;
      if (debugEnabled) {
        setDebugState({ mode, featuredId: choice.id });
      }

      recentIdsRef.current[mode] = [
        { id: choice.id, timestamp: now },
        ...recentEntries.filter(entry => now - entry.timestamp < FEATURED_REPEAT_BLOCK_MS),
      ];
    };

    pickFeatured();
    const interval = window.setInterval(pickFeatured, POPUP_CHECK_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [debugEnabled, mode, reducedMotion]);

  useEffect(() => {
    if (!reducedMotion) return;
    const current = activeMarkerRef.current;
    if (current) {
      current.marker.getPopup()?.remove();
      activeMarkerRef.current = null;
    }
  }, [reducedMotion]);

  if (!HAS_MAPBOX_TOKEN) {
    return (
      <div className="grid h-full w-full place-items-center rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
        <div className="space-y-2">
          <div className="text-sm font-semibold text-slate-900">Globe view unavailable</div>
          <div className="text-sm text-slate-600">
            This deployment is missing the Mapbox token (<code>NEXT_PUBLIC_MAPBOX_TOKEN</code>).
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm"
      role="region"
      aria-label="Rotating globe showing approved projects, funding opportunities, and watchdog issues."
    >
      <div ref={containerRef} className="h-full w-full" />
      <span className="sr-only">
        The globe rotates automatically and highlights a featured item when it is in view. Use the mode controls to
        switch between projects, funding, and issues.
      </span>
      <div className="pointer-events-none absolute inset-x-6 bottom-6 rounded-2xl bg-white/85 p-4 text-sm text-slate-700 shadow-lg ring-1 ring-black/5 backdrop-blur-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          {FEATURED_COPY[mode].title}
        </div>
        <p className="mt-1 text-sm text-slate-600">{FEATURED_COPY[mode].description}</p>
      </div>
      {debugEnabled ? (
        <div className="pointer-events-none absolute left-6 top-6 rounded-2xl bg-slate-900/85 px-4 py-3 text-xs text-slate-100 shadow-lg ring-1 ring-black/10">
          <div className="font-semibold uppercase tracking-wide text-emerald-200">Globe debug</div>
          <div className="mt-1 space-y-1">
            <div>
              <span className="text-slate-300">Mode:</span> {debugState?.mode ?? mode}
            </div>
            <div>
              <span className="text-slate-300">Featured:</span> {debugState?.featuredId ?? "—"}
            </div>
            <div>
              <span className="text-slate-300">In-view threshold:</span> {IN_VIEW_THRESHOLD}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
