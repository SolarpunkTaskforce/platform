/**
 * LikeButton Component
 *
 * A reusable like button with count display and "liked" state.
 * Supports optimistic UI - toggles immediately while caller handles async operations.
 *
 * Intended wiring (Phase 2):
 * - Parent component should maintain like state in database
 * - onToggle should update database and handle rollback on error
 * - Initial count/liked state should come from database query
 *
 * Example usage:
 * ```tsx
 * <LikeButton
 *   count={likes.length}
 *   liked={userHasLiked}
 *   onToggle={async () => {
 *     // Database mutation here
 *     await toggleLike(postId, userId);
 *   }}
 * />
 * ```
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type LikeButtonSize = "default" | "sm" | "lg";

const sizeClasses: Record<LikeButtonSize, { button: string; icon: string; text: string }> = {
  sm: {
    button: "h-8 px-2 gap-1",
    icon: "h-4 w-4",
    text: "text-xs",
  },
  default: {
    button: "h-10 px-3 gap-2",
    icon: "h-5 w-5",
    text: "text-sm",
  },
  lg: {
    button: "h-12 px-4 gap-2",
    icon: "h-6 w-6",
    text: "text-base",
  },
};

export interface LikeButtonProps {
  /** Current number of likes */
  count: number;
  /** Whether the current user has liked */
  liked: boolean;
  /** Callback when like is toggled - should handle database updates */
  onToggle: () => Promise<void> | void;
  /** Disable the button */
  disabled?: boolean;
  /** Button size variant */
  size?: LikeButtonSize;
  /** Additional CSS classes */
  className?: string;
}

function formatCount(count: number): string {
  if (count < 1000) return `${count}`;
  return new Intl.NumberFormat(undefined, { notation: "compact" }).format(count);
}

export const LikeButton = React.forwardRef<HTMLButtonElement, LikeButtonProps>(
  ({ count, liked, onToggle, disabled = false, size = "default", className }, ref) => {
    const [isOptimisticallyLiked, setIsOptimisticallyLiked] = React.useState(liked);
    const [optimisticCount, setOptimisticCount] = React.useState(count);
    const [isPending, setIsPending] = React.useState(false);

    // Sync with external state changes
    React.useEffect(() => {
      setIsOptimisticallyLiked(liked);
      setOptimisticCount(count);
    }, [liked, count]);

    const handleClick = async () => {
      if (disabled || isPending) return;

      // Optimistic update
      const previousLiked = isOptimisticallyLiked;
      const previousCount = optimisticCount;
      const newLiked = !isOptimisticallyLiked;
      const newCount = optimisticCount + (newLiked ? 1 : -1);

      setIsOptimisticallyLiked(newLiked);
      setOptimisticCount(Math.max(0, newCount));
      setIsPending(true);

      try {
        await onToggle();
      } catch (error) {
        // Rollback on error
        setIsOptimisticallyLiked(previousLiked);
        setOptimisticCount(previousCount);
        console.error("Failed to toggle like:", error);
      } finally {
        setIsPending(false);
      }
    };

    const sizes = sizeClasses[size];

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        disabled={disabled || isPending}
        className={cn(
          "inline-flex items-center justify-center rounded-full font-medium transition-all",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-soltas-ocean",
          "disabled:pointer-events-none disabled:opacity-50",
          isOptimisticallyLiked
            ? "bg-soltas-ocean/10 text-soltas-ocean border border-soltas-ocean/30"
            : "bg-white text-soltas-muted border border-soltas-glacial/30 hover:bg-soltas-light hover:text-soltas-ocean",
          sizes.button,
          className,
        )}
        aria-label={isOptimisticallyLiked ? "Unlike" : "Like"}
        aria-pressed={isOptimisticallyLiked}
      >
        {/* Heart Icon */}
        <svg
          className={cn(sizes.icon, "transition-transform", isPending && "animate-pulse")}
          fill={isOptimisticallyLiked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          />
        </svg>
        {/* Count */}
        <span className={cn("font-semibold", sizes.text)}>{formatCount(optimisticCount)}</span>
      </button>
    );
  },
);

LikeButton.displayName = "LikeButton";
