import Map from "@/components/Map";
import { fetchApprovedProjectMarkers } from "@/lib/projectMarkers";

export default async function MapPage() {
  const markers = await fetchApprovedProjectMarkers();

  return (
    <main className="h-[calc(100vh-3.5rem)] w-full">
      <Map markers={markers} />
    </main>
  );
}
