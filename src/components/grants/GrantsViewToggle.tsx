"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

type GrantsViewToggleProps = {
  view: "globe" | "table";
};

export default function GrantsViewToggle({ view }: GrantsViewToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setView = useCallback(
    (nextView: "globe" | "table") => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", nextView);
      const query = params.toString();
      router.push(query ? `/funding?${query}` : "/funding");
    },
    [router, searchParams],
  );

  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 text-sm">
      <Button
        type="button"
        size="sm"
        variant={view === "globe" ? "secondary" : "ghost"}
        onClick={() => setView("globe")}
      >
        Globe view
      </Button>
      <Button
        type="button"
        size="sm"
        variant={view === "table" ? "secondary" : "ghost"}
        onClick={() => setView("table")}
      >
        Table view
      </Button>
    </div>
  );
}
