import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "outline" | "ocean";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-soltas-light text-soltas-bark",
  outline: "border border-soltas-glacial/30 text-soltas-bark",
  ocean: "bg-soltas-glacial/20 text-soltas-ocean",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
