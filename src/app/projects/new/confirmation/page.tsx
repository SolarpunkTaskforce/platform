import Link from "next/link";

export default function ProjectConfirmationPage() {
  return (
    <main className="mx-auto max-w-xl space-y-6 px-4 pb-16 pt-20 text-center sm:px-6">
      <h1 className="text-3xl font-semibold text-slate-900">Project submitted</h1>
      <p className="text-base text-slate-600">
        Thank you for sharing your work with the Solarpunk Taskforce. Our team will review the details and reach out if we
        need anything else. You will receive an update once the project is approved.
      </p>
      <div className="flex flex-col items-center gap-3">
        <Link
          href="/projects"
          className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Browse projects
        </Link>
        <Link href="/projects/new" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
          Submit another project
        </Link>
      </div>
    </main>
  );
}
