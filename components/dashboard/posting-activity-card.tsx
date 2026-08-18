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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      <CardHeader>
        <CardTitle className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
          {title}
        </CardTitle>
        <CardDescription className="text-muted-foreground/80 text-xs">{subtitle}</CardDescription>
        <CardAction>
          <Select
            value={activeYear}
            onValueChange={(value) => value && setSelectedYear(String(value))}
            disabled={years.length === 0}
          >
            <SelectTrigger
              size="sm"
              className="bg-muted/70 hover:bg-muted dark:bg-muted/70 dark:hover:bg-muted h-7 w-auto min-w-20 rounded-full border-0 px-3 text-xs tabular-nums data-[size=sm]:rounded-full"
              aria-label={chartLabels.year ?? "Year"}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" alignItemWithTrigger={false} className="max-h-64">
              {years.map((year) => (
                <SelectItem key={year} value={year} label={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
