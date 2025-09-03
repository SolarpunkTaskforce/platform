"use client";
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";

export default function MapGeocoder({ onSelect }: { onSelect: (v: { lat: number; lng: number; place_name: string }) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
    const map = new mapboxgl.Map({ container: document.createElement("div"), style: "mapbox://styles/mapbox/streets-v11" });
    const geocoder = new MapboxGeocoder({ accessToken: mapboxgl.accessToken, mapboxgl });
    geocoder.addTo(containerRef.current!);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    geocoder.on("result", (e: any) => {
      const [lng, lat] = e.result.center;
      onSelect({ lat, lng, place_name: e.result.place_name });
    });
    return () => {
      geocoder.clear();
      geocoder.off("result", () => {});
      map.remove();
    };
  }, [onSelect]);
  return <div ref={containerRef} className="w-full" />;
}
