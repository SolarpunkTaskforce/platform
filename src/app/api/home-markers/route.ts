import { NextResponse } from "next/server";

import { fetchHomeGrantMarkers } from "@/lib/grants/homeGrantsQuery";
import { fetchHomeProjectMarkers } from "@/lib/projects/homeProjectsQuery";
import { fetchHomeWatchdogMarkers } from "@/lib/watchdog/homeWatchdogQuery";

export const revalidate = 600;

export async function GET() {
  try {
    const [projectMarkers, grantMarkers, issueMarkers] = await Promise.all([
      fetchHomeProjectMarkers(),
      fetchHomeGrantMarkers(),
      fetchHomeWatchdogMarkers(),
    ]);

    return NextResponse.json(
      {
        projectMarkers,
        grantMarkers,
        issueMarkers,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load home markers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
