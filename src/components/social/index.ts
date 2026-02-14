/**
 * Social UI Components
 *
 * Pure UI components for social interactions (likes, comments).
 * No database dependencies - intended for wiring in Phase 2.
 *
 * Components:
 * - LikeButton: Like button with count and optimistic UI
 * - Comments: Full comments section (list + composer)
 * - CommentsList: Display comments with delete affordance
 * - CommentComposer: Form for posting comments
 */

export { LikeButton, type LikeButtonProps } from "./LikeButton";
export { Comments, CommentsList, CommentComposer, type Comment, type CommentsProps } from "./Comments";
