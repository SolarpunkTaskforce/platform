"use client";
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

type Marker = { id: string; lng: number; lat: number; title?: string };

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

    markers.forEach(m => {
      const marker = new mapboxgl.Marker()
        .setLngLat([m.lng, m.lat])
        .setPopup(new mapboxgl.Popup().setText(m.title ?? ""));
      marker.addTo(mapRef.current!);
      markerObjs.current.push(marker);
    });
  }, [markers]);

  return <div ref={containerRef} className="h-full w-full" />;
}

