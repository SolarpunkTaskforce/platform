"use client";

type NewUpdateButtonProps = {
  isAuthenticated: boolean;
};

export default function NewUpdateButton({ isAuthenticated }: NewUpdateButtonProps) {
  const handleClick = () => {
    // Phase 1: Show alert for stub functionality
    alert("Publishing updates coming soon!");
  };

  if (!isAuthenticated) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-soltas-muted cursor-not-allowed opacity-60"
      >
        Log in to post an update
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
    >
      New update
    </button>
  );
}
