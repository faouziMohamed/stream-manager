"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { fr } from "react-day-picker/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/helpers";

type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * Themed calendar using react-day-picker with shadcn/Tailwind styling.
 * No react-day-picker/style.css — fully custom classNames.
 */
function Calendar({ className, classNames, ...props }: CalendarProps) {
  return (
    <DayPicker
      locale={fr}
      showOutsideDays
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-3",
        month_caption: "flex justify-center relative items-center h-7",
        caption_label: "text-sm font-medium capitalize",
        nav: "flex items-center gap-1",
        button_previous:
          "absolute left-1 top-0 inline-flex items-center justify-center rounded-md h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity",
        button_next:
          "absolute right-1 top-0 inline-flex items-center justify-center rounded-md h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity",
        weekday:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] capitalize",
        weekdays: "flex",
        week: "flex w-full mt-1",
        day: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
        day_button: cn(
          "inline-flex items-center justify-center rounded-md h-8 w-8 p-0 font-normal",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "aria-selected:opacity-100 cursor-pointer transition-colors",
        ),
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-md",
        today: "bg-accent text-accent-foreground rounded-md",
        outside: "text-muted-foreground/40",
        disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
export type { CalendarProps };
