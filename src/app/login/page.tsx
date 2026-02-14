import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-soltas-bark">Sign in</h1>
        <p className="text-sm text-soltas-muted">
          Sign in to your account to continue.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
