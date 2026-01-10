import Map from "@/components/Map";
import { fetchApprovedProjectMarkers } from "@/lib/projectMarkers";

export const metadata = {
  title: "Environmental Projects",
};

export default async function EnvironmentalProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const focus = typeof params.focus === "string" ? params.focus : null;

  const markers = await fetchApprovedProjectMarkers({
    category: "environmental",
  });

  return (
    <main className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="px-6 pb-2 pt-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Environmental Projects
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Approved environmental initiatives displayed on the interactive globe.
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <Map
          markers={markers}
          markerColor="#064e3b"
          focusSlug={focus}
        />
      </div>
    </main>
  );
}
