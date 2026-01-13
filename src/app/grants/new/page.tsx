// src/app/grants/new/page.tsx
import nextDynamic from "next/dynamic";

// Ensure this page is not statically prerendered during `next build`
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Load GrantForm on the client only
const GrantForm = nextDynamic(() => import("@/components/grants/GrantForm"), {
  ssr: false,
});

export default function NewGrantPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">
          Register a grant opportunity
        </h1>
        <p className="text-sm text-slate-600">
          Provide as much detail as you can. Your submission will be reviewed by
          an administrator before it goes live.
        </p>
      </div>

      <GrantForm />
    </main>
  );
}
