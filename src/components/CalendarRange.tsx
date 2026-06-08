"use client";

import * as React from "react";
import { type DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  dateRange: DateRange | undefined;
  setDateRange: React.Dispatch<React.SetStateAction<DateRange | undefined>>;
};

export function CalendarRange({ dateRange, setDateRange }: Props) {
  return (
    <Card className="mx-auto w-fit p-0">
      <CardContent className="p-0">
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={setDateRange}
          numberOfMonths={1}
          defaultMonth={dateRange?.from ?? new Date()}
          disabled={(date) =>
            date > new Date("2100-01-01") || date < new Date("1900-01-01")
          }
        />
      </CardContent>
    </Card>
  );
}