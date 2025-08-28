"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

export default function HomePage() {
  return (
    <main className="h-[calc(100vh-3.5rem)] w-full">
      <Map markers={[]} />
    </main>
  );
}

