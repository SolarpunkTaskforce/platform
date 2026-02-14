import UpdateCard from "./UpdateCard";
import NewUpdateButton from "./NewUpdateButton";

// TODO: Expected data shape for updates
// type UpdateSummary = {
//   id: string;
//   title: string;
//   summary: string;
//   created_at: string;
//   author_name?: string;
//   href?: string;
// };

export type UpdateSummary = {
  id: string;
  title: string;
  summary: string;
  created_at: string;
  author_name?: string;
  href?: string;
};

type UpdatesSectionProps = {
  updates: UpdateSummary[];
  isAuthenticated: boolean;
  canPost?: boolean;
};

export default function UpdatesSection({
  updates,
  isAuthenticated,
  canPost = false,
}: UpdatesSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-soltas-muted">
          Updates
        </h2>
        {canPost ? <NewUpdateButton isAuthenticated={isAuthenticated} /> : null}
      </div>

      {updates.length > 0 ? (
        <div className="mt-4 space-y-4">
          {updates.map((update) => (
            <UpdateCard
              key={update.id}
              title={update.title}
              summary={update.summary}
              date={update.created_at}
              authorName={update.author_name}
              href={update.href}
            />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-soltas-muted">No updates yet.</p>
      )}
    </section>
  );
}
