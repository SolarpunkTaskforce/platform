import Map from "@/components/Map";
import { fetchApprovedProjectMarkers } from "@/lib/projectMarkers";

export const metadata = {
  title: "Humanitarian Projects",
};

export default async function HumanitarianProjectsPage() {
  const markers = await fetchApprovedProjectMarkers({ category: "humanitarian" });

  return (
    <main className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="px-6 pb-2 pt-6">
        <h1 className="text-2xl font-semibold text-slate-900">Humanitarian Projects</h1>
        <p className="mt-2 text-sm text-slate-600">
          Approved humanitarian initiatives displayed on the interactive globe.
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <Map markers={markers} markerColor="#7f1d1d" />
      </div>
    </main>
  );
}
