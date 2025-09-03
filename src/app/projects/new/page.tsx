import ProjectForm from "@/components/projects/ProjectForm";

export default function NewProjectPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Add Project</h1>
      <ProjectForm />
    </main>
  );
}
