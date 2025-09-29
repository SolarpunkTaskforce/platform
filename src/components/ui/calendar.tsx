import * as React from "react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";

import "react-day-picker/dist/style.css";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex items-center justify-between px-1 text-sm font-medium",
        caption_label: "text-base font-semibold text-slate-900",
        nav: "flex items-center gap-1",
        nav_button:
          "flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "w-9 text-center text-xs font-semibold uppercase tracking-wide text-slate-500",
        row: "flex w-full",
        cell: "relative w-9 text-center text-sm",
        day: cn(
          "flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium text-slate-700 transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
        ),
        day_today: "bg-emerald-50 text-emerald-700",
        day_selected: "bg-emerald-600 text-white hover:bg-emerald-600",
        day_outside: "text-slate-300",
        day_disabled: "text-slate-300 opacity-50",
        day_range_start: "rounded-l-full",
        day_range_end: "rounded-r-full",
        ...classNames,
      }}
      {...props}
    />
  );
}
