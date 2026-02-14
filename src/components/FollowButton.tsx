"use client";

import { useState, useTransition } from "react";

export type FollowTargetType = "person" | "org" | "project";

type FollowButtonProps = {
  targetType: FollowTargetType;
  targetId: string;
  initialIsFollowing: boolean;
  initialFollowerCount: number | null;
  isAuthenticated: boolean;
};

function formatCount(count: number) {
  if (count < 1000) return `${count}`;
  return new Intl.NumberFormat(undefined, { notation: "compact" }).format(count);
}

export default function FollowButton({
  targetType,
  targetId,
  initialIsFollowing,
  initialFollowerCount,
  isAuthenticated,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    if (!isAuthenticated) return;

    startTransition(async () => {
      setError(null);
      const method = isFollowing ? "DELETE" : "POST";

      const res = await fetch("/api/follow", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setError(payload?.error ?? "Unable to update follow.");
        return;
      }

      setIsFollowing(!isFollowing);
      if (typeof followerCount === "number") {
        setFollowerCount(Math.max(0, followerCount + (isFollowing ? -1 : 1)));
      }
    });
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={!isAuthenticated || isPending}
        className={`inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
          isFollowing
            ? "border-soltas-ocean/30 bg-soltas-glacial/15 text-soltas-ocean"
            : "border-soltas-glacial/30 bg-white text-soltas-bark hover:bg-soltas-light"
        }`}
      >
        {isAuthenticated ? (isFollowing ? "Following" : "Follow") : "Sign in to follow"}
      </button>
      {typeof followerCount === "number" ? (
        <div className="text-xs text-soltas-muted">{`${formatCount(followerCount)} followers`}</div>
      ) : null}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
