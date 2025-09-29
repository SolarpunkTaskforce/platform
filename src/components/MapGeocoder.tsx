"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

type LocationResult = { lat: number; lng: number; place_name: string };

type MapGeocoderProps = {
  onSelect: (value: LocationResult) => void;
};

export default function MapGeocoder({ onSelect }: MapGeocoderProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.warn("Mapbox token missing. Add NEXT_PUBLIC_MAPBOX_TOKEN to .env");
      container.innerHTML = "<p class=\"text-sm text-rose-600\">Map search unavailable: missing Mapbox token.</p>";
      return;
    }

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: document.createElement("div"),
      style: "mapbox://styles/mapbox/streets-v12",
    });

    const geocoder = new MapboxGeocoder({
      accessToken: token,
      mapboxgl,
      marker: false,
      placeholder: "Search for a place or address",
    });

    geocoder.addTo(container);

    const handleResult = (event: { result: { center: [number, number]; place_name: string } }) => {
      const [lng, lat] = event.result.center;
      onSelect({ lat, lng, place_name: event.result.place_name });
    };

    geocoder.on("result", handleResult);

    return () => {
      geocoder.off("result", handleResult);
      geocoder.clear();
      map.remove();
    };
  }, [onSelect]);

  return <div ref={containerRef} className="w-full min-h-[56px]" />;
}
