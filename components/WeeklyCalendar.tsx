"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DayItem = {
  value: string;
  weekdayLabel: string;
  dayLabel: string;
};

type WeeklyCalendarProps = {
  dates: DayItem[];
  selectedDate: string;
  onSelect: (date: string) => void;
};

export function WeeklyCalendar({
  dates,
  selectedDate,
  onSelect
}: WeeklyCalendarProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
      {dates.map((dateItem, index) => {
        const isSelected = dateItem.value === selectedDate;
        const isToday = index === 0;

        return (
          <Button
            key={dateItem.value}
            type="button"
            variant={isSelected ? "default" : "secondary"}
            className={cn(
              "h-auto flex-col items-start rounded-[1.5rem] px-4 py-4 text-left",
              !isSelected && "border border-border bg-white/80"
            )}
            onClick={() => onSelect(dateItem.value)}
          >
            <span className="text-xs uppercase tracking-[0.18em] opacity-70">
              {isToday ? "today" : dateItem.weekdayLabel}
            </span>
            <span className="mt-2 text-base font-semibold">{dateItem.dayLabel}</span>
          </Button>
        );
      })}
    </div>
  );
}
