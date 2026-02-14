/**
 * Comments Component
 *
 * A compound component that combines CommentsList and CommentComposer.
 * Provides a complete comments section out of the box.
 *
 * Intended wiring (Phase 2):
 * - Parent should fetch comments from database and pass as array
 * - onSubmit should insert new comment to database and trigger refetch
 * - onDelete should remove comment from database and trigger refetch
 * - Consider using React Query or SWR for automatic refetching
 *
 * Example usage:
 * ```tsx
 * <Comments
 *   comments={commentsFromDB}
 *   onSubmit={async (body) => {
 *     await createComment(postId, userId, body);
 *     refetchComments();
 *   }}
 *   onDelete={async (id) => {
 *     await deleteComment(id);
 *     refetchComments();
 *   }}
 * />
 * ```
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CommentsList, type Comment } from "./CommentsList";
import { CommentComposer } from "./CommentComposer";

export interface CommentsProps {
  /** Array of comments to display */
  comments: Comment[];
  /** Callback when new comment is submitted */
  onSubmit: (body: string) => Promise<void> | void;
  /** Callback when comment is deleted */
  onDelete: (id: string) => Promise<void> | void;
  /** Show loading state */
  isLoading?: boolean;
  /** Disable composer (e.g., if user not authenticated) */
  disabled?: boolean;
  /** Placeholder for comment input */
  placeholder?: string;
  /** Show composer (set to false to make read-only) */
  showComposer?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export const Comments = React.forwardRef<HTMLDivElement, CommentsProps>(
  (
    {
      comments,
      onSubmit,
      onDelete,
      isLoading = false,
      disabled = false,
      placeholder,
      showComposer = true,
      className,
    },
    ref,
  ) => {
    return (
      <div ref={ref} className={cn("space-y-6", className)}>
        {/* Comment composer */}
        {showComposer && (
          <div>
            <h3 className="text-sm font-semibold text-soltas-text mb-3">Add a comment</h3>
            <CommentComposer onSubmit={onSubmit} disabled={disabled} placeholder={placeholder} />
          </div>
        )}

        {/* Comments list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-soltas-text">
              Comments {!isLoading && comments.length > 0 && `(${comments.length})`}
            </h3>
          </div>
          <CommentsList comments={comments} onDelete={onDelete} isLoading={isLoading} />
        </div>
      </div>
    );
  },
);

Comments.displayName = "Comments";

// Export child components for flexible usage
export { CommentsList, CommentComposer };
export type { Comment };
