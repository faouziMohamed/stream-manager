"use client";

import * as React from "react";
import { CalendarIcon, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils/helpers";
import { formatDateShort, toISODate } from "@/lib/utils/date";

interface DatePickerProps {
  /** Controlled value — YYYY-MM-DD string or undefined */
  value?: string;
  onChange: (date: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Disable days before this date */
  fromDate?: Date;
  /** Disable days after this date */
  toDate?: Date;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Sélectionner une date",
  disabled,
  className,
  fromDate,
  toDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = value ? new Date(`${value}T00:00:00`) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-9",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <span className="flex-1 truncate">
            {selected ? formatDateShort(selected) : placeholder}
          </span>
          {selected && (
            <X
              className="ml-auto h-3.5 w-3.5 shrink-0 opacity-50 hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onChange(undefined);
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(day) => {
            onChange(day ? toISODate(day) : undefined);
            setOpen(false);
          }}
          disabled={[
            ...(fromDate ? [{ before: fromDate }] : []),
            ...(toDate ? [{ after: toDate }] : []),
          ]}
          defaultMonth={selected}
        />
      </PopoverContent>
    </Popover>
  );
}
