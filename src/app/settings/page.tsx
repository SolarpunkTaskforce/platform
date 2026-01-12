export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
    </div>
  );
}

<Link
  href="/settings/notifications"
  className="block rounded-lg border border-slate-200 bg-white p-4 hover:bg-slate-50"
>
  <div className="font-medium text-slate-900">Notifications</div>
  <p className="text-sm text-slate-600">
    Email and collaboration preferences
  </p>
</Link>