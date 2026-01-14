import type { GrantMarker } from "@/lib/grants/findGrantsQuery";
import { fetchGrantMarkers } from "@/lib/grants/findGrantsQuery";

const DEFAULT_LIMIT = 160;

export async function fetchHomeGrantMarkers(limit: number = DEFAULT_LIMIT): Promise<GrantMarker[]> {
  return fetchGrantMarkers({ searchParams: {}, limit });
}
