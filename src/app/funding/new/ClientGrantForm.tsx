"use client";

import dynamic from "next/dynamic";

const GrantForm = dynamic(() => import("@/components/grants/GrantForm"), {
  ssr: false,
  loading: () => (
    <div className="rounded-md border border-slate-200 p-4 text-sm text-soltas-muted">
      Loading form…
    </div>
  ),
});

export default function ClientGrantForm() {
  return <GrantForm />;
}
