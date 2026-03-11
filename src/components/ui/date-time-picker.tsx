"use client";

import * as React from "react";
import { CalendarIcon, Clock, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils/helpers";
import { dayjs, formatDateTime, toISODate } from "@/lib/utils/date";

interface DateTimePickerProps {
  /**
   * Controlled value — full ISO 8601 string or undefined.
   * On change, always emits a full ISO 8601 string.
   */
  value?: string;
  onChange: (iso: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Sélectionner date & heure",
  disabled,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const parsed = value ? dayjs(value) : null;
  const selectedDay = parsed?.isValid() ? parsed.toDate() : undefined;
  const hours = parsed?.isValid() ? parsed.format("HH") : "00";
  const minutes = parsed?.isValid() ? parsed.format("mm") : "00";

  function buildISO(day: Date, h: string, m: string) {
    return dayjs(toISODate(day))
      .hour(Number(h))
      .minute(Number(m))
      .second(0)
      .millisecond(0)
      .toISOString();
  }

  function handleDaySelect(day: Date | undefined) {
    if (!day) {
      onChange(undefined);
      return;
    }
    onChange(buildISO(day, hours, minutes));
  }

  function handleHourChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (!selectedDay) return;
    onChange(buildISO(selectedDay, e.target.value, minutes));
  }

  function handleMinuteChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (!selectedDay) return;
    onChange(buildISO(selectedDay, hours, e.target.value));
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(undefined);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-9",
            !selectedDay && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <span className="flex-1 truncate">
            {selectedDay ? formatDateTime(value) : placeholder}
          </span>
          {selectedDay && (
            <X
              className="ml-auto h-3.5 w-3.5 shrink-0 opacity-50 hover:opacity-100 transition-opacity"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
        <Calendar
          mode="single"
          selected={selectedDay}
          onSelect={handleDaySelect}
          defaultMonth={selectedDay}
        />
        <Separator />
        <div className="flex items-center gap-2 px-3 py-2.5">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">Heure</span>
          <div className="ml-auto flex items-center gap-1">
            <select
              value={hours}
              onChange={handleHourChange}
              disabled={!selectedDay}
              className={cn(
                "h-8 w-14 rounded-md border border-input bg-background px-2 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-ring",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "appearance-none text-center cursor-pointer",
              )}
            >
              {Array.from({ length: 24 }, (_, i) =>
                String(i).padStart(2, "0"),
              ).map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <span className="text-sm font-medium text-muted-foreground">:</span>
            <select
              value={minutes}
              onChange={handleMinuteChange}
              disabled={!selectedDay}
              className={cn(
                "h-8 w-14 rounded-md border border-input bg-background px-2 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-ring",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "appearance-none text-center cursor-pointer",
              )}
            >
              {Array.from({ length: 60 }, (_, i) =>
                String(i).padStart(2, "0"),
              ).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <Button
            size="sm"
            variant="default"
            className="ml-2 h-8 px-3 text-xs"
            onClick={() => setOpen(false)}
          >
            OK
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
