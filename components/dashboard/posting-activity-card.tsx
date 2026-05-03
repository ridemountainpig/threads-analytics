"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import PostingCalendarChart from "@/components/charts/posting-calendar-chart";

type ChartLabels = {
  less: string;
  more: string;
  days: readonly string[];
  date?: string;
  weekday?: string;
  posts?: string;
  year?: string;
  noData?: string;
};

export default function PostingActivityCard({
  title,
  subtitle,
  data,
  dateLocale,
  chartLabels,
}: {
  title: string;
  subtitle: string;
  data: Array<{ date: string; count: number }>;
  dateLocale?: string;
  chartLabels: ChartLabels;
}) {
  const years = useMemo(
    () =>
      Array.from(new Set(data.map((d) => d.date.slice(0, 4)))).sort(
        (a, b) => Number(b) - Number(a),
      ),
    [data],
  );
  const [selectedYear, setSelectedYear] = useState<string>("");
  const activeYear = selectedYear && years.includes(selectedYear) ? selectedYear : (years[0] ?? "");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm tracking-wider uppercase">
          {title}
        </CardTitle>
        <CardDescription className="text-xs">{subtitle}</CardDescription>
        <CardAction>
          <label className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground whitespace-nowrap">
              {chartLabels.year ?? "Year"}
            </span>
            <select
              className="bg-background border-input h-7 max-w-[8.5rem] rounded-md border px-2"
              value={activeYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              disabled={years.length === 0}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </CardAction>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <PostingCalendarChart
          data={data}
          dateLocale={dateLocale}
          selectedYear={activeYear}
          labels={chartLabels}
        />
      </CardContent>
    </Card>
  );
}
