import ProjectForm from "@/components/projects/ProjectForm";

export default function AddProjectPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Submit a project</h1>
        <p className="text-sm text-slate-600">
          Share the details of your Solarpunk initiative so the Taskforce can review and champion your work.
        </p>
      </div>
      <ProjectForm />
    </div>
  );
}
