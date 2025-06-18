"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  dateRange?: DateRange;
  onRangeChange?: (range: DateRange | undefined) => void;
  mode?: "single" | "range";
  selected?: Date | undefined;
  onSelect?: (date: Date | undefined) => void;
  className?: string;
  initialFocus?: boolean;
}

export function DateRangePicker({
  dateRange,
  onRangeChange,
  className,
  mode = "range",
  selected,
  onSelect,
  initialFocus,
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(dateRange);

  const handleRangeChange = (range: DateRange | undefined) => {
    setDate(range);
    onRangeChange?.(range);
  };

  const handleDateSelect = (day: Date | undefined) => {
    onSelect?.(day);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      {mode === "range" ? (
        <Calendar
          initialFocus={initialFocus}
          mode="range"
          defaultMonth={date?.from}
          selected={date}
          onSelect={handleRangeChange}
          numberOfMonths={2}
        />
      ) : (
        <Calendar
          initialFocus={initialFocus}
          mode="single"
          selected={selected}
          onSelect={handleDateSelect}
          numberOfMonths={1}
        />
      )}
    </div>
  );
}
