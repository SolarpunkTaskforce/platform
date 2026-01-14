import type { WatchdogIssueMarker } from "@/lib/watchdog/findWatchdogIssuesQuery";
import { fetchWatchdogMarkers } from "@/lib/watchdog/findWatchdogIssuesQuery";

const DEFAULT_LIMIT = 160;

export async function fetchHomeWatchdogMarkers(
  limit: number = DEFAULT_LIMIT,
): Promise<WatchdogIssueMarker[]> {
  return fetchWatchdogMarkers({ searchParams: {}, limit });
}
