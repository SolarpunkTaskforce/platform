import Map from "@/components/Map";
import { getServerSupabase } from "@/lib/supabaseServer";

export default async function MapPage() {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, lat, lng")
    .eq("approval_status", "approved");
  if (error) {
    return <Map markers={[]} />;
  }
  const markers = (data ?? []).map(p => ({ id: p.id, title: p.title, lat: p.lat, lng: p.lng }));
  return <Map markers={markers} />;
}
