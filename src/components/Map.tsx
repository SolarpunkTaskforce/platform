"use client";
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

const truncate = (value: string, length = 160) =>
  value.length > length ? `${value.slice(0, length).trimEnd()}…` : value;

type Marker = {
  id: string;
  lng: number;
  lat: number;
  title: string;
  placeName?: string | null;
  description?: string | null;
};

export default function Map({ markers = [] as Marker[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerObjs = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return; // already initialized

    // Guard: avoid initializing without token in dev
    if (!mapboxgl.accessToken) {
      console.error("Missing NEXT_PUBLIC_MAPBOX_TOKEN");
      return;
    }

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [0, 0],
      zoom: 2,
    });
    mapRef.current = map;

    return () => {
      markerObjs.current.forEach(m => m.remove());
      markerObjs.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    // clear previous markers
    markerObjs.current.forEach(m => m.remove());
    markerObjs.current = [];

    const map = mapRef.current;
    if (!map) return;
    const validMarkers = markers.filter(
      m => Number.isFinite(m.lng) && Number.isFinite(m.lat)
    );

    validMarkers.forEach(m => {
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

      popup.setDOMContent(popupNode);

      const marker = new mapboxgl.Marker()
        .setLngLat([m.lng, m.lat])
        .setPopup(popup);
      marker.addTo(map);
      markerObjs.current.push(marker);
    });

    if (validMarkers.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      validMarkers.forEach(m => bounds.extend([m.lng, m.lat]));
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
  }, [markers]);

  return <div ref={containerRef} className="h-full w-full" />;
}

