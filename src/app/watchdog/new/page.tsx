import WatchdogIssueForm from "@/components/watchdog/WatchdogIssueForm";

export default function NewWatchdogIssuePage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Register an issue</h1>
        <p className="text-sm text-slate-600">
          Share a Watchdog issue with the community. Submissions are reviewed before appearing publicly.
        </p>
      </div>
      <WatchdogIssueForm />
    </main>
  );
}
