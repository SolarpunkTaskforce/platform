"use client";

import { useEffect, useRef } from "react";
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
};

type MapProps = {
  markers?: Marker[];
  markerColor?: string;
  focusSlug?: string | null;
  ctaLabel?: string;
  getCtaHref?: (marker: Marker) => string;
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
  // clamp so markers don't get absurdly tiny/huge
  return Math.min(Math.max(scale, 0.65), 1.75);
};

export default function Map({
  markers = [],
  markerColor = "#22c55e",
  focusSlug = null,
  ctaLabel = "View project",
  getCtaHref,
}: MapProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerObjs = useRef<MarkerObject[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [0, 0],
      zoom: 1.25,
    });

    mapRef.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      "top-right"
    );
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markerObjs.current.forEach((obj) => obj.marker.remove());
    markerObjs.current = [];

    const validMarkers = markers.filter(
      (m) => Number.isFinite(m.lng) && Number.isFinite(m.lat)
    );
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
        const href = getCtaHref ? getCtaHref(m) : `/projects/${m.slug}`;
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

    // Fit map to markers
    if (validMarkers.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      validMarkers.forEach((m) => bounds.extend([m.lng, m.lat]));

      if (validMarkers.length === 1) {
        map.easeTo({
          center: [validMarkers[0].lng, validMarkers[0].lat],
          zoom: 8,
          duration: 1000,
        });
      } else {
        map.fitBounds(bounds, { padding: 40, duration: 1000 });
      }
    }

    // Focus a specific project marker (open popup + center map)
    if (focusSlug) {
      const focused = markerObjs.current.find((o) => o.slug === focusSlug);
      if (focused) {
        map.easeTo({
          center: [focused.lng, focused.lat],
          zoom: Math.max(map.getZoom(), 4),
          duration: 800,
        });

        focused.marker.getPopup()?.addTo(map);
      }
    }
  }, [ctaLabel, focusSlug, getCtaHref, markerColor, markers, router]);

  return <div ref={containerRef} className="h-full w-full" />;
}
