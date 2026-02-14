# Social UI Components

Pure UI components for social interactions (likes, comments). These components have no database dependencies and are ready for wiring in Phase 2.

## Components

### LikeButton

A reusable like button with count display and "liked" state. Supports optimistic UI - toggles immediately while the caller handles async operations.

**Props:**
- `count: number` - Current number of likes
- `liked: boolean` - Whether the current user has liked
- `onToggle: () => Promise<void> | void` - Callback when like is toggled
- `disabled?: boolean` - Disable the button
- `size?: "sm" | "default" | "lg"` - Button size variant
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
import { LikeButton } from "@/components/social";

<LikeButton
  count={42}
  liked={false}
  onToggle={async () => {
    // Database mutation here
    await toggleLike(postId, userId);
  }}
  size="default"
/>
```

**Phase 2 Wiring:**
- Parent component should maintain like state in database
- `onToggle` should update database and handle rollback on error
- Initial count/liked state should come from database query

---

### Comments

A compound component that combines CommentsList and CommentComposer, providing a complete comments section out of the box.

**Props:**
- `comments: Comment[]` - Array of comments to display
- `onSubmit: (body: string) => Promise<void> | void` - Callback when new comment is submitted
- `onDelete: (id: string) => Promise<void> | void` - Callback when comment is deleted
- `isLoading?: boolean` - Show loading state
- `disabled?: boolean` - Disable composer
- `placeholder?: string` - Placeholder for comment input
- `showComposer?: boolean` - Show composer (set to false for read-only)
- `className?: string` - Additional CSS classes

**Comment Type:**
```tsx
interface Comment {
  id: string;
  authorName: string;
  body: string;
  createdAt: Date;
  canDelete: boolean;
}
```

**Usage:**
```tsx
import { Comments } from "@/components/social";

<Comments
  comments={[
    {
      id: "1",
      authorName: "Jane Doe",
      body: "Great project!",
      createdAt: new Date("2026-01-15"),
      canDelete: false
    }
  ]}
  onSubmit={async (body) => {
    await createComment(postId, userId, body);
    refetchComments();
  }}
  onDelete={async (id) => {
    await deleteComment(id);
    refetchComments();
  }}
/>
```

**Phase 2 Wiring:**
- Parent should fetch comments from database and pass as array
- `onSubmit` should insert new comment to database and trigger refetch
- `onDelete` should remove comment from database and trigger refetch
- Consider using React Query or SWR for automatic refetching

---

### CommentsList

Renders a list of comments with author info, timestamp, and delete affordance. Displays an empty state when no comments are present.

**Props:**
- `comments: Comment[]` - Array of comments to display
- `onDelete: (id: string) => Promise<void> | void` - Callback when delete is clicked
- `isLoading?: boolean` - Show loading state
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
import { CommentsList } from "@/components/social";

<CommentsList
  comments={commentsArray}
  onDelete={async (id) => await deleteComment(id)}
  isLoading={false}
/>
```

---

### CommentComposer

A form for composing and submitting new comments. Includes a textarea and submit button with loading/disabled states.

**Props:**
- `onSubmit: (body: string) => Promise<void> | void` - Callback when comment is submitted
- `placeholder?: string` - Placeholder text for textarea
- `disabled?: boolean` - Disable the composer
- `maxLength?: number` - Maximum character length (default: 2000)
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
import { CommentComposer } from "@/components/social";

<CommentComposer
  onSubmit={async (body) => {
    await createComment(postId, userId, body);
  }}
  placeholder="Share your thoughts..."
/>
```

---

## Design Patterns

All components follow the existing design system:

- **Styling:** Tailwind CSS with `soltas-*` color tokens
- **Accessibility:** ARIA labels, keyboard navigation, focus states
- **Responsive:** Mobile-friendly with appropriate touch targets
- **Loading States:** Built-in loading and disabled states
- **Error Handling:** Graceful error handling with user feedback

## File Structure

```
src/components/social/
├── index.ts              # Main exports
├── LikeButton.tsx        # Like button component
├── Comments.tsx          # Compound comments component
├── CommentsList.tsx      # Comments list component
├── CommentComposer.tsx   # Comment form component
└── README.md             # This file
```

## Testing

Run these commands to verify the components:

```bash
# TypeScript type checking
pnpm typecheck

# Development server (should compile without errors)
pnpm dev
```

## Next Steps (Phase 2)

1. **Database Integration:**
   - Create database tables for likes and comments
   - Set up Row Level Security (RLS) policies
   - Add database queries/mutations

2. **API Routes:**
   - POST /api/likes - Toggle like
   - GET /api/comments?postId=X - Fetch comments
   - POST /api/comments - Create comment
   - DELETE /api/comments/:id - Delete comment

3. **State Management:**
   - Implement React Query or SWR for data fetching
   - Add optimistic updates with automatic rollback
   - Cache invalidation strategies

4. **Authentication:**
   - Integrate with Supabase Auth
   - Determine `canDelete` based on user ownership
   - Disable interactions for unauthenticated users
