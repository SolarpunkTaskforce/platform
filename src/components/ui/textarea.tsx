import * as React from "react";

import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex w-full rounded-xl border border-[#6B9FB8]/40 bg-white px-4 py-3 text-base text-[#1A2B38] placeholder:text-[#8A9BAB] transition focus:border-[#6B9FB8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6B9FB8]/60 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
