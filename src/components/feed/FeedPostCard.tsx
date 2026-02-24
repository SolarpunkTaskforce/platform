"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

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
  currentUserId?: string | null;
  createdBy?: string | null;
  authorOrganisationId?: string | null;
  userOrganisationIds?: string[];
  onUpdate?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
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
  currentUserId,
  createdBy,
  authorOrganisationId,
  userOrganisationIds = [],
  onUpdate,
  onDelete,
}: FeedPostCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entityLink = getEntityLink(entityType, entityId, entitySlug);

  // Determine if user can edit/delete
  const canEdit = currentUserId && (
    // User created the post personally
    (createdBy === currentUserId && !authorOrganisationId) ||
    // User is admin/owner of the org that authored the post
    (authorOrganisationId && userOrganisationIds.includes(authorOrganisationId))
  );

  const handleEdit = () => {
    setIsEditing(true);
    setShowMenu(false);
    setError(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(content);
    setError(null);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      setError("Content cannot be empty");
      return;
    }
    if (editContent.length > 5000) {
      setError("Content is too long (max 5000 characters)");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/feed-posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update post");
        return;
      }

      setIsEditing(false);
      if (onUpdate) {
        onUpdate(id, editContent);
      } else {
        // Refresh the page if no callback provided
        window.location.reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update post");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    setIsDeleting(true);
    setShowMenu(false);
  };

  const handleConfirmDelete = async () => {
    setError(null);

    try {
      const response = await fetch(`/api/feed-posts/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to delete post");
        setIsDeleting(false);
        return;
      }

      if (onDelete) {
        onDelete(id);
      } else {
        // Refresh the page if no callback provided
        window.location.reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post");
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleting(false);
    setError(null);
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex gap-3">
        {authorAvatarUrl ? (
          <Image
            src={authorAvatarUrl}
            alt={authorName}
            width={40}
            height={40}
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
            <div className="flex items-center gap-2">
              <time className="text-xs text-soltas-muted" dateTime={timestamp ?? undefined}>
                {formatTimestamp(timestamp)}
              </time>
              {canEdit && !isEditing && !isDeleting && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="rounded p-1 text-soltas-muted hover:bg-slate-100 hover:text-soltas-text"
                    aria-label="More options"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {showMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                      />
                      <div className="absolute right-0 top-full z-20 mt-1 w-32 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                        <button
                          onClick={handleEdit}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-soltas-text hover:bg-slate-50"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                        <button
                          onClick={handleDelete}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-soltas-text focus:border-soltas-ocean focus:outline-none focus:ring-1 focus:ring-soltas-ocean"
                rows={4}
                maxLength={5000}
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-soltas-muted">
                  {editContent.length} / 5000
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-soltas-text hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          ) : isDeleting ? (
            <div className="space-y-2">
              <p className="text-sm text-soltas-text">
                Are you sure you want to delete this post? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleCancelDelete}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-soltas-text hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-sm text-soltas-text">{content}</p>
          )}

          {entityLink && !isEditing && !isDeleting && (
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
