import Map from "@/components/Map";
import { getServerSupabase } from "@/lib/supabaseServer";

export default async function HomePage() {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, description, place_name, lat, lng")
    .eq("status", "approved")
    .not("lat", "is", null)
    .not("lng", "is", null)
    .limit(100);

  if (error) {
    console.error("Failed to load approved projects for home map", error);
  }

  const markers = (data ?? []).map(project => ({
    id: project.id,
    title: project.name,
    lat: project.lat!,
    lng: project.lng!,
    placeName: project.place_name,
    description: project.description ?? undefined,
  }));

  return (
    <main className="h-[calc(100vh-3.5rem)] w-full">
      <Map markers={markers} />
    </main>
  );
}

