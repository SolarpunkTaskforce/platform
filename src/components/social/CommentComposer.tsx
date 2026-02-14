/**
 * CommentComposer Component
 *
 * A form for composing and submitting new comments.
 * Includes a textarea and submit button with loading/disabled states.
 *
 * Intended wiring (Phase 2):
 * - Parent should handle database insertion in onSubmit callback
 * - After successful submission, parent should refetch comments
 * - Optional: Add authentication check to disable if user not logged in
 *
 * Example usage:
 * ```tsx
 * <CommentComposer
 *   onSubmit={async (body) => {
 *     await createComment(postId, userId, body);
 *   }}
 *   placeholder="Share your thoughts..."
 * />
 * ```
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export interface CommentComposerProps {
  /** Callback when comment is submitted - should handle database insertion */
  onSubmit: (body: string) => Promise<void> | void;
  /** Placeholder text for textarea */
  placeholder?: string;
  /** Disable the composer */
  disabled?: boolean;
  /** Maximum character length */
  maxLength?: number;
  /** Additional CSS classes */
  className?: string;
}

export const CommentComposer = React.forwardRef<HTMLDivElement, CommentComposerProps>(
  ({ onSubmit, placeholder = "Write a comment...", disabled = false, maxLength = 2000, className }, ref) => {
    const [body, setBody] = React.useState("");
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      const trimmedBody = body.trim();
      if (!trimmedBody || isSubmitting || disabled) return;

      setIsSubmitting(true);
      setError(null);

      try {
        await onSubmit(trimmedBody);
        setBody(""); // Clear on success
        textareaRef.current?.focus();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to post comment");
        console.error("Failed to submit comment:", err);
      } finally {
        setIsSubmitting(false);
      }
    };

    const isDisabled = disabled || isSubmitting;
    const canSubmit = body.trim().length > 0 && !isDisabled;

    return (
      <div ref={ref} className={cn("space-y-3", className)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={placeholder}
              disabled={isDisabled}
              maxLength={maxLength}
              rows={3}
              className={cn(
                "resize-none",
                error && "border-rose-500 focus:border-rose-500 focus-visible:ring-rose-500",
              )}
              aria-label="Comment text"
            />
            {/* Character count */}
            {body.length > maxLength * 0.8 && (
              <div
                className={cn(
                  "absolute bottom-2 right-2 text-xs font-medium",
                  body.length >= maxLength ? "text-rose-600" : "text-soltas-muted",
                )}
              >
                {body.length}/{maxLength}
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-rose-600">
              <svg
                className="h-4 w-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Submit button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!canSubmit}
              variant={canSubmit ? "default" : "outline"}
              size="default"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>Posting...</span>
                </>
              ) : (
                <span>Post Comment</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    );
  },
);

CommentComposer.displayName = "CommentComposer";
