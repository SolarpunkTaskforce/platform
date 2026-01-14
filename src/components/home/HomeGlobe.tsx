"use client";

import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { ProjectMarker } from "@/lib/projects/findProjectsQuery";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const HAS_MAPBOX_TOKEN = typeof MAPBOX_TOKEN === "string" && MAPBOX_TOKEN.length > 0;
mapboxgl.accessToken = MAPBOX_TOKEN || "";

const ROTATION_SPEED_DEG_PER_SEC = 1.25;
const MIN_SWITCH_MS = 8000;
const RECENT_POOL_SIZE = 6;
const IN_VIEW_THRESHOLD = 0.3;

type HomeGlobeMarker = {
  id: string;
  slug: string;
  lng: number;
  lat: number;
  title: string;
  placeName?: string | null;
  description?: string | null;
  markerColor?: string;
};

type MarkerObject = {
  marker: mapboxgl.Marker;
  slug: string;
  id: string;
  lng: number;
  lat: number;
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

const isMarkerInView = (marker: MarkerObject, center: mapboxgl.LngLat) => {
  const a = toUnitVector(marker.lng, marker.lat);
  const b = toUnitVector(center.lng, center.lat);
  const dot = a.x * b.x + a.y * b.y + a.z * b.z;
  return dot > IN_VIEW_THRESHOLD;
};

export default function HomeGlobe({ markers }: { markers: ProjectMarker[] }) {
  const reducedMotion = usePrefersReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerObjs = useRef<MarkerObject[]>([]);
  const activeMarkerRef = useRef<MarkerObject | null>(null);
  const recentIdsRef = useRef<string[]>([]);
  const lastSwitchRef = useRef<number>(0);
  const rotationFrameRef = useRef<number | null>(null);
  const lastRotationTimeRef = useRef<number | null>(null);
  const userInteractedRef = useRef(false);
  const userInteractTimerRef = useRef<number | null>(null);

  const mapMarkers: HomeGlobeMarker[] = useMemo(
    () =>
      markers.map(marker => ({
        id: marker.id,
        slug: marker.slug ?? marker.id,
        lng: typeof marker.lng === "number" ? marker.lng : Number.NaN,
        lat: typeof marker.lat === "number" ? marker.lat : Number.NaN,
        title: marker.name ?? "Untitled project",
        placeName: marker.place_name,
        description: marker.description,
        markerColor: marker.category === "humanitarian" ? "#7f1d1d" : "#064e3b",
      })),
    [markers],
  );

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

    const markInteracted = () => {
      userInteractedRef.current = true;
      if (userInteractTimerRef.current != null) {
        window.clearTimeout(userInteractTimerRef.current);
      }
      userInteractTimerRef.current = window.setTimeout(() => {
        userInteractedRef.current = false;
        userInteractTimerRef.current = null;
      }, 2500);
    };

    map.on("dragstart", markInteracted);
    map.on("zoomstart", markInteracted);
    map.on("rotatestart", markInteracted);
    map.on("pitchstart", markInteracted);

    mapRef.current = map;

    return () => {
      if (userInteractTimerRef.current != null) window.clearTimeout(userInteractTimerRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, []);

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
      popupNode.className = "space-y-2 text-sm text-slate-700";

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

      if (marker.description) {
        const descriptionEl = document.createElement("p");
        descriptionEl.className = "text-sm leading-snug text-slate-600";
        descriptionEl.textContent = truncate(marker.description);
        popupNode.appendChild(descriptionEl);
      }

      const cta = document.createElement("a");
      cta.href = `/projects/${marker.slug}`;
      cta.className =
        "mt-2 inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800";
      cta.textContent = "See more";
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

      markerObjs.current.push({
        marker: mapMarker,
        slug: marker.slug,
        id: marker.id,
        lng: marker.lng,
        lat: marker.lat,
      });
    });
  }, [mapMarkers]);

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

      const recent = new Set(recentIdsRef.current);
      const fresh = candidates.filter(marker => !recent.has(marker.id));
      const pool = fresh.length ? fresh : candidates;
      const choice = pool[Math.floor(Math.random() * pool.length)];

      choice.marker.getPopup()?.addTo(map);
      activeMarkerRef.current = choice;
      lastSwitchRef.current = now;

      recentIdsRef.current = [choice.id, ...recentIdsRef.current].slice(0, RECENT_POOL_SIZE);
    };

    pickFeatured();
    const interval = window.setInterval(pickFeatured, 1000);
    return () => window.clearInterval(interval);
  }, [reducedMotion]);

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
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute inset-x-6 bottom-6 rounded-2xl bg-white/85 p-4 text-sm text-slate-700 shadow-lg ring-1 ring-black/5 backdrop-blur-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Featured projects
        </div>
        <p className="mt-1 text-sm text-slate-600">
          The globe highlights approved projects as they rotate into view.
        </p>
      </div>
    </div>
  );
}
