import Map from "@/components/Map";
import { getServerSupabase } from "@/lib/supabaseServer";

export default async function MapPage() {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, lat, lng")
    .eq("status", "approved");
  if (error) {
    return <Map markers={[]} />;
  }
  const markers = (data ?? []).map(p => ({ id: p.id, title: p.name, lat: p.lat, lng: p.lng }));
  return <Map markers={markers} />;
}
