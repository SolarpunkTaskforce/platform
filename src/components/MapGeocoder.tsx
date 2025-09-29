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
    const tokenLooksValid = typeof token === "string" && /^pk\./.test(token);

    if (!tokenLooksValid) {
      console.warn(
        "Mapbox token missing or invalid. Add a public token to NEXT_PUBLIC_MAPBOX_TOKEN in your .env file."
      );
      container.innerHTML =
        "<p class=\"text-sm text-rose-600\">Map search unavailable: add a valid Mapbox public token.</p>";
      return;
    }

    mapboxgl.accessToken = token;

    try {
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

      const handleError = (error: unknown) => {
        console.error("Mapbox geocoder error", error);
        container.innerHTML =
          "<p class=\"text-sm text-rose-600\">Map search unavailable: check your Mapbox token.</p>";
      };

      geocoder.on("error", handleError);

      return () => {
        geocoder.off("result", handleResult);
        geocoder.off("error", handleError);
        geocoder.clear();
        map.remove();
      };
    } catch (error) {
      console.error("Failed to initialise Mapbox geocoder", error);
      container.innerHTML =
        "<p class=\"text-sm text-rose-600\">Map search unavailable: failed to initialise Mapbox geocoder.</p>";
      return () => {};
    }
  }, [onSelect]);

  return <div ref={containerRef} className="w-full min-h-[56px]" />;
}
