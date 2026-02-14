import Link from "next/link";

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-5 pb-20 pt-12">
      <div>
        <h1 className="text-2xl font-semibold text-[#1A2B38]">Settings</h1>
        <p className="mt-1 text-sm text-soltas-muted">
          Manage your account preferences.
        </p>
      </div>

      <div className="space-y-3">
        <Link
          href="/settings/notifications"
          className="block rounded-2xl border border-[#6B9FB8]/25 bg-white p-4 hover:bg-[#EEF2F5] transition-all duration-200"
        >
          <div className="font-medium text-[#1A2B38]">Notifications</div>
          <p className="text-sm text-soltas-muted">
            Email and collaboration preferences
          </p>
        </Link>
      </div>
    </main>
  );
}
