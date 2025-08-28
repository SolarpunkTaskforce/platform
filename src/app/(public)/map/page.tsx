import Map from "@/components/Map";
import { supabaseServer } from "@/lib/supabaseServer";

export default async function MapPage() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, lat, lng")
    .eq("status", "approved");

  if (error) {
    // Fail closed: empty markers
    return <Map markers={[]} />;
  }

  const markers = (data ?? []).map(p => ({ id: p.id, title: p.title, lat: p.lat, lng: p.lng }));
  return <Map markers={markers} />;
}
