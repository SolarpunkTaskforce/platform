"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Organisation = {
  id: string;
  name: string | null;
};

type NewPostComposerProps = {
  userId: string;
  userName: string;
  organisations?: Organisation[];
};

export function NewPostComposer({ userName, organisations = [] }: NewPostComposerProps) {
  const [content, setContent] = useState("");
  const [postAs, setPostAs] = useState<string>("me");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError("Please enter some content for your post.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/feed-posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
          author_organisation_id: postAs === "me" ? null : postAs,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to create post" }));
        throw new Error(errorData.error || "Failed to create post");
      }

      // Success - reset form
      setContent("");
      setPostAs("me");

      // Refresh the page to show the new post
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while creating the post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-soltas-muted">
        New post
      </h2>

      <div className="space-y-4">
        <Textarea
          placeholder="What's happening?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          disabled={isSubmitting}
          className="resize-none"
        />

        {organisations.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="post-as" className="text-sm font-medium text-soltas-text">
              Post as:
            </label>
            <Select value={postAs} onValueChange={setPostAs} disabled={isSubmitting}>
              <SelectTrigger id="post-as" className="w-auto min-w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="me">{userName}</SelectItem>
                {organisations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name || "Unnamed organisation"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !content.trim()}>
            {isSubmitting ? "Posting..." : "Post"}
          </Button>
        </div>
      </div>
    </form>
  );
}
