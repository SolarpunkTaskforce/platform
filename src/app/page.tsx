"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

export default function HomePage() {
  return (
    <main className="p-4">
      <div className="mb-4 text-xl font-semibold">Solarpunk Taskforce</div>
      <Map markers={[]} />
    </main>
  );
}

