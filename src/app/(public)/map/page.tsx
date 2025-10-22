import Map from "@/components/Map";
import { getServerSupabase } from "@/lib/supabaseServer";

export default async function MapPage() {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, description, place_name, lat, lng")
    .eq("status", "approved")
    .not("lat", "is", null)
    .not("lng", "is", null);

  if (error) {
    console.error("Failed to load approved projects for map", error);
    return <Map markers={[]} />;
  }

  const markers = (data ?? []).map(project => ({
    id: project.id,
    title: project.name,
    lat: project.lat!,
    lng: project.lng!,
    placeName: project.place_name,
    description: project.description ?? undefined,
  }));

  return <Map markers={markers} />;
}
