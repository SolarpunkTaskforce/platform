import Link from "next/link";

type FeedPostCardProps = {
  id: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  content: string;
  timestamp: string | null;
  entityType?: string | null;
  entityId?: string | null;
  entitySlug?: string | null;
  entityName?: string | null;
};

function formatTimestamp(timestamp: string | null) {
  if (!timestamp) return "Recently";
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function getEntityLink(
  entityType: string | null | undefined,
  entityId: string | null | undefined,
  entitySlug: string | null | undefined,
): { href: string; label: string } | null {
  if (!entityType || !entityId) return null;

  if (entityType === "project") {
    return {
      href: entitySlug ? `/projects/${entitySlug}` : `/projects`,
      label: entitySlug ? `Re: project` : "Re: project",
    };
  }

  if (entityType === "funding") {
    return {
      href: entitySlug ? `/funding/${entitySlug}` : `/funding`,
      label: entitySlug ? `Re: funding` : "Re: funding",
    };
  }

  if (entityType === "issue") {
    return {
      href: `/watchdog/${entityId}`,
      label: "Re: watchdog issue",
    };
  }

  return null;
}

export function FeedPostCard({
  id,
  authorName,
  authorAvatarUrl,
  content,
  timestamp,
  entityType,
  entityId,
  entitySlug,
  entityName,
}: FeedPostCardProps) {
  const entityLink = getEntityLink(entityType, entityId, entitySlug);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex gap-3">
        {authorAvatarUrl ? (
          <img
            src={authorAvatarUrl}
            alt={authorName}
            className="h-10 w-10 rounded-full border border-slate-200 object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50 text-sm text-soltas-muted">
            {authorName[0]?.toUpperCase() ?? "?"}
          </div>
        )}

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-soltas-bark">{authorName}</p>
            <time className="text-xs text-soltas-muted" dateTime={timestamp ?? undefined}>
              {formatTimestamp(timestamp)}
            </time>
          </div>

          <p className="whitespace-pre-wrap text-sm text-soltas-text">{content}</p>

          {entityLink && (
            <div className="pt-1">
              <Link
                href={entityLink.href}
                className="inline-flex items-center gap-1 text-xs text-soltas-ocean hover:underline"
              >
                {entityLink.label}
                {entityName && <span className="font-medium">· {entityName}</span>}
              </Link>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
