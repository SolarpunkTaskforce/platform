"use client";

type Props = {
  projectId: string;
  category: string;
  view: string;
};

export function DeleteProjectButton({ projectId, category, view }: Props) {
  return (
    <form
      action={`/api/admin/projects/${projectId}/delete`}
      method="post"
      className="inline"
      onSubmit={e => {
        const ok = window.confirm(
          "Delete this project permanently?\n\nThis will remove the project and its related records. This cannot be undone.",
        );
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="view" value={view} />
      <button className="rounded border border-red-500 px-3 py-1 text-red-600 transition hover:bg-red-50">
        Delete
      </button>
    </form>
  );
}
