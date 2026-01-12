import Link from "next/link";

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 pb-16 pt-10">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage your account preferences.
        </p>
      </div>

      <div className="space-y-3">
        <Link
          href="/settings/notifications"
          className="block rounded-lg border border-slate-200 bg-white p-4 hover:bg-slate-50"
        >
          <div className="font-medium text-slate-900">Notifications</div>
          <p className="text-sm text-slate-600">
            Email and collaboration preferences
          </p>
        </Link>
      </div>
    </main>
  );
}
