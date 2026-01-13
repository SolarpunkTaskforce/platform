"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

const truncate = (value: string, length = 160) =>
  value.length > length ? `${value.slice(0, length).trimEnd()}…` : value;

type Marker = {
  id: string;
  slug: string;
  lng: number;
  lat: number;
  title: string;
  placeName?: string | null;
  description?: string | null;
  ctaHref?: string;
};

type MapProps = {
  markers?: Marker[];
  markerColor?: string;
  focusSlug?: string | null;
  ctaLabel?: string;

  /** Bump this number to force a recenter (used when collapsing/expanding side panels) */
  recenterNonce?: number;
};

type MarkerObject = {
  marker: mapboxgl.Marker;
  element: HTMLDivElement;
  slug: string;
  lng: number;
  lat: number;
};

const getMarkerScale = (zoom: number) => {
  const scale = zoom / 8;
  return Math.min(Math.max(scale, 0.65), 1.75);
};

export default function Map({
  markers = [],
  markerColor = "#22c55e",
  focusSlug = null,
  ctaLabel = "View",
  recenterNonce,
}: MapProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerObjs = useRef<MarkerObject[]>([]);

  // Track if the user has interacted recently, so resize doesn't "fight" them.
  const userInteractedRef = useRef(false);
  const userInteractTimerRef = useRef<number | null>(null);

  const validMarkers = useMemo(
    () => markers.filter((m) => Number.isFinite(m.lng) && Number.isFinite(m.lat)),
    [markers],
  );

  const fitToMarkers = (map: mapboxgl.Map, animate: boolean) => {
    if (validMarkers.length === 0) {
      if (animate) {
        map.easeTo({ center: [0, 0], zoom: 1.25, duration: 350 });
      } else {
        map.jumpTo({ center: [0, 0], zoom: 1.25 });
      }
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();
    validMarkers.forEach((m) => bounds.extend([m.lng, m.lat]));

    if (validMarkers.length === 1) {
      const [lng, lat] = [validMarkers[0].lng, validMarkers[0].lat];
      if (animate) {
        map.easeTo({ center: [lng, lat], zoom: 3, duration: 350 });
      } else {
        map.jumpTo({ center: [lng, lat], zoom: 3 });
      }
    } else {
      map.fitBounds(bounds, { padding: 60, duration: animate ? 350 : 0 });
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [0, 0],
      zoom: 1.25,
      preserveDrawingBuffer: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");

    const markInteracted = () => {
      userInteractedRef.current = true;
      if (userInteractTimerRef.current != null) {
        window.clearTimeout(userInteractTimerRef.current);
      }
      userInteractTimerRef.current = window.setTimeout(() => {
        userInteractedRef.current = false;
        userInteractTimerRef.current = null;
      }, 1500);
    };

    map.on("dragstart", markInteracted);
    map.on("zoomstart", markInteracted);
    map.on("rotatestart", markInteracted);
    map.on("pitchstart", markInteracted);

    mapRef.current = map;

    return () => {
      if (userInteractTimerRef.current != null) {
        window.clearTimeout(userInteractTimerRef.current);
      }
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Resize observer: smooth resizing without frequent white flashes.
  useEffect(() => {
    const map = mapRef.current;
    const el = containerRef.current;
    if (!map || !el) return;

    let rafId: number | null = null;
    let settleTimer: number | null = null;

    const scheduleResize = () => {
      if (rafId != null) return;

      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        map.resize();
      });

      if (settleTimer != null) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        if (!userInteractedRef.current) {
          fitToMarkers(map, false);
        }
      }, 180);
    };

    const ro = new ResizeObserver(() => scheduleResize());
    ro.observe(el);

    return () => {
      ro.disconnect();
      if (rafId != null) window.cancelAnimationFrame(rafId);
      if (settleTimer != null) window.clearTimeout(settleTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validMarkers]);

  // Force recenter on demand (e.g. collapsing/expanding the panel)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const id = window.requestAnimationFrame(() => {
      map.resize();
      // Explicitly override the "don't fight the user" rule for this one action
      userInteractedRef.current = false;
      fitToMarkers(map, false);
    });

    return () => window.cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recenterNonce]);

  // Render markers + initial fit when marker set changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markerObjs.current.forEach((obj) => obj.marker.remove());
    markerObjs.current = [];

    const scale = getMarkerScale(map.getZoom());

    validMarkers.forEach((m) => {
      const popup = new mapboxgl.Popup({ offset: 12, maxWidth: "320px" });

      const popupNode = document.createElement("div");
      popupNode.className = "space-y-2 text-sm text-slate-700";

      const titleEl = document.createElement("h3");
      titleEl.className = "text-base font-semibold text-slate-900";
      titleEl.textContent = m.title;
      popupNode.appendChild(titleEl);

      if (m.placeName) {
        const placeEl = document.createElement("p");
        placeEl.className = "text-xs uppercase tracking-wide text-slate-500";
        placeEl.textContent = m.placeName;
        popupNode.appendChild(placeEl);
      }

      if (m.description) {
        const descriptionEl = document.createElement("p");
        descriptionEl.className = "text-sm leading-snug text-slate-600";
        descriptionEl.textContent = truncate(m.description);
        popupNode.appendChild(descriptionEl);
      }

      const cta = document.createElement("button");
      cta.type = "button";
      cta.className =
        "mt-2 inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800";
      cta.textContent = ctaLabel;
      cta.addEventListener("click", () => {
        const href = m.ctaHref ?? `/projects/${m.slug}`;
        router.push(href);
      });
      popupNode.appendChild(cta);

      popup.setDOMContent(popupNode);

      const el = document.createElement("div");
      Object.assign(el.style, {
        width: "20px",
        height: "20px",
        borderRadius: "9999px",
        backgroundColor: markerColor,
        boxShadow: "0 4px 12px rgba(15, 23, 42, 0.35)",
        transform: `translate(-50%, -50%) scale(${scale})`,
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([m.lng, m.lat])
        .setPopup(popup)
        .addTo(map);

      markerObjs.current.push({
        marker,
        element: el,
        slug: m.slug,
        lng: m.lng,
        lat: m.lat,
      });
    });

    // When marker set changes, it's OK to re-center.
    userInteractedRef.current = false;
    fitToMarkers(map, true);

    if (focusSlug) {
      const focused = markerObjs.current.find((o) => o.slug === focusSlug);
      if (focused) {
        map.easeTo({
          center: [focused.lng, focused.lat],
          zoom: Math.max(map.getZoom(), 4),
          duration: 450,
        });
        focused.marker.getPopup()?.addTo(map);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctaLabel, focusSlug, markerColor, router, validMarkers]);

  return <div ref={containerRef} className="h-full w-full bg-slate-100" />;
}
