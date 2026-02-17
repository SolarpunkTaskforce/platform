import Link from "next/link";
import { Suspense } from "react";
import SignupTabs from "@/components/auth/SignupTabs";

export default function SignupPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-soltas-bark">Create your account</h1>
        <p className="text-sm text-soltas-muted">
          Choose the signup flow that matches you. Individuals can link to a verified
          organisation or continue independently.
        </p>
        <p className="text-sm text-soltas-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#11526D] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
      <Suspense fallback={<div className="rounded-2xl border border-[#6B9FB8]/25 bg-white p-6 text-sm text-soltas-muted">Loading...</div>}>
        <SignupTabs />
      </Suspense>
    </div>
  );
}
