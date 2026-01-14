import "server-only";

import { headers } from "next/headers";

import type { HomeStats } from "@/lib/homeStats";

const getBaseUrl = async () => {
  const headerList = await headers();
  const host = headerList.get("host");
  if (host) {
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    return `${protocol}://${host}`;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
};

export async function fetchHomeStats(): Promise<HomeStats> {
  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}/api/home-stats`, {
    next: { revalidate: 600 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch home stats: ${response.status}`);
  }

  return response.json() as Promise<HomeStats>;
}
