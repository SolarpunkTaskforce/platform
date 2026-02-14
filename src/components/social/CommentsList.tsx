/**
 * CommentsList Component
 *
 * Renders a list of comments with author info, timestamp, and delete affordance.
 * Displays an empty state when no comments are present.
 *
 * Intended wiring (Phase 2):
 * - Parent should fetch comments from database and pass as array
 * - onDelete should trigger database deletion and refetch comments
 * - canDelete logic should be determined by comparing comment author with current user
 *
 * Example usage:
 * ```tsx
 * <CommentsList
 *   comments={[
 *     {
 *       id: "1",
 *       authorName: "Jane Doe",
 *       body: "Great project!",
 *       createdAt: new Date("2026-01-15"),
 *       canDelete: false
 *     }
 *   ]}
 *   onDelete={async (id) => {
 *     await deleteComment(id);
 *   }}
 * />
 * ```
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface Comment {
  id: string;
  authorName: string;
  body: string;
  createdAt: Date;
  canDelete: boolean;
}

export interface CommentsListProps {
  /** Array of comments to display */
  comments: Comment[];
  /** Callback when delete is clicked - should handle database deletion */
  onDelete: (id: string) => Promise<void> | void;
  /** Show loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;

  // Fallback to date string
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export const CommentsList = React.forwardRef<HTMLDivElement, CommentsListProps>(
  ({ comments, onDelete, isLoading = false, className }, ref) => {
    const [deletingIds, setDeletingIds] = React.useState<Set<string>>(new Set());

    const handleDelete = async (id: string) => {
      if (deletingIds.has(id)) return;

      setDeletingIds((prev) => new Set(prev).add(id));

      try {
        await onDelete(id);
      } catch (error) {
        console.error("Failed to delete comment:", error);
      } finally {
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    };

    // Empty state
    if (!isLoading && comments.length === 0) {
      return (
        <div ref={ref} className={cn("flex flex-col items-center justify-center py-12", className)}>
          <div className="rounded-full bg-soltas-light p-4 mb-4">
            <svg
              className="h-8 w-8 text-soltas-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p className="text-soltas-muted text-sm font-medium">No comments yet</p>
          <p className="text-soltas-muted text-xs mt-1">Be the first to share your thoughts</p>
        </div>
      );
    }

    // Loading state
    if (isLoading) {
      return (
        <div ref={ref} className={cn("space-y-4", className)}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-soltas-light" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-soltas-light rounded" />
                  <div className="h-3 w-full bg-soltas-light rounded" />
                  <div className="h-3 w-2/3 bg-soltas-light rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div ref={ref} className={cn("space-y-4", className)}>
        {comments.map((comment) => {
          const isDeleting = deletingIds.has(comment.id);

          return (
            <div
              key={comment.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl transition-all",
                "border border-soltas-glacial/20 bg-white",
                isDeleting && "opacity-50",
              )}
            >
              {/* Avatar placeholder */}
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-soltas-glacial/20 flex items-center justify-center">
                <span className="text-soltas-ocean text-sm font-semibold">
                  {comment.authorName.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Comment content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-soltas-text">{comment.authorName}</span>
                  <span className="text-xs text-soltas-muted">{formatTimeAgo(comment.createdAt)}</span>
                </div>
                <p className="text-sm text-soltas-text whitespace-pre-wrap break-words">{comment.body}</p>
              </div>

              {/* Delete button */}
              {comment.canDelete && (
                <button
                  type="button"
                  onClick={() => handleDelete(comment.id)}
                  disabled={isDeleting}
                  className={cn(
                    "flex-shrink-0 p-1 rounded-lg transition-colors",
                    "text-soltas-muted hover:text-rose-600 hover:bg-rose-50",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-600",
                    "disabled:pointer-events-none disabled:opacity-50",
                  )}
                  aria-label="Delete comment"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  },
);

CommentsList.displayName = "CommentsList";
