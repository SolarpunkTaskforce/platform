import SignupTabs from "@/components/auth/SignupTabs";

export default function SignupPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Create your account</h1>
        <p className="text-sm text-slate-600">
          Choose the signup flow that matches you. Individuals can link to a verified
          organisation or continue independently.
        </p>
      </div>
      <SignupTabs />
    </div>
  );
}
