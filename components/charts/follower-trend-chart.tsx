"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  activeDot,
  axisTick,
  barCursor,
  barRadius,
  chartColors,
  compactChartMargin,
  formatCompactNumber,
  formatShortDate,
  spansMultipleYears,
  gridProps,
  lineCursor,
  negativeColor,
} from "./chart-style";
import AxisHint from "./axis-hint";
import {
  ChartAreaGradient,
  ChartEmptyState,
  ChartLegend,
  ChartTooltip,
  useChartMotion,
  type ChartTooltipRow,
} from "./chart-chrome";
import { SegmentedControl } from "./segmented-control";
import type { PostsOnDay } from "@/lib/followers";

/** Wide enough for a spelled-out four-figure follower count. */
const Y_AXIS_WIDTH = 52;
// Annotation, not data: slate rather than the interactive tint.
const MARKER_COLOR = chartColors.trend;
const MODE_STORAGE_KEY = "follower-chart-mode";
/** At most this many days get an on-chart value label in the change view. */
const MAX_SPIKE_LABELS = 3;

type Mode = "overall" | "change";

interface FollowerTrendChartProps {
  data: Array<{ date: string; followers: number; change: number | null }>;
  postsByDate?: Record<string, PostsOnDay>;
  dateLocale?: string;
  timeZone: string;
  labels?: {
    followers: string;
    dailyChange: string;
    overall: string;
    posted: string;
    postsThatDay: string;
    views: string;
    viewMode?: string;
    date: string;
    noData: string;
  };
}

function truncate(text: string, max = 36) {
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length > max ? `${oneLine.slice(0, max - 1)}…` : oneLine;
}

// Days whose move stands ≥2σ from the mean, and by at least a handful of
// people, get a value label so the eye lands on the day worth explaining.
function findSpikes(changes: Array<number | null>): Set<number> {
  const values = changes.filter((c): c is number => c !== null);
  if (values.length < 4) return new Set();
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const sd = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
  const threshold = Math.max(3, 2 * sd);
  const picked: number[] = [];
  for (const { i } of changes
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c !== null && Math.abs(c - mean) >= threshold)
    .sort((a, b) => Math.abs(b.c!) - Math.abs(a.c!))) {
    if (picked.length >= MAX_SPIKE_LABELS) break;
    // Neighbouring bars share the label of the larger one; two would overlap.
    if (picked.some((j) => Math.abs(j - i) <= 1)) continue;
    picked.push(i);
  }
  return new Set(picked);
}

export default function FollowerTrendChart({
  data,
  postsByDate,
  dateLocale,
  timeZone,
  labels,
}: FollowerTrendChartProps) {
  const locale = dateLocale ?? "en-US";
  const motion = useChartMotion();
  const [mode, setModeState] = useState<Mode>("overall");
  // Read after mount so server and client paint the same first frame.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(MODE_STORAGE_KEY);
      if (stored === "overall" || stored === "change") setModeState(stored);
    } catch {
      // Storage unavailable — keep the default.
    }
  }, []);
  const setMode = (next: Mode) => {
    setModeState(next);
    try {
      window.localStorage.setItem(MODE_STORAGE_KEY, next);
    } catch {
      // Best-effort persistence.
    }
  };
  const copy = labels ?? {
    followers: "Followers",
    dailyChange: "Daily Change",
    overall: "Overall",
    posted: "Posted",
    postsThatDay: "Posts that day",
    views: "views",
    date: "Date",
    noData: "No data",
  };
  const modeOptions = useMemo(
    () => [
      { value: "overall" as const, label: copy.overall },
      { value: "change" as const, label: copy.dailyChange },
    ],
    [copy.overall, copy.dailyChange],
  );

  if (!data.length) {
    return <ChartEmptyState label={copy.noData} height={200} />;
  }

  const isChange = mode === "change";
  const withYear = spansMultipleYears(data.map((point) => point.date));

  // Follower counts rarely start near zero, so a zero-based axis would flatten
  // the line into a straight edge. Pad around the observed range instead; the
  // change view always includes zero so gains and losses read against it.
  const values = isChange
    ? [0, ...data.map((p) => p.change).filter((c): c is number => c !== null)]
    : data.map((p) => p.followers);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(1, Math.round((max - min) * 0.15));
  const domain: [number, number] = [min - pad, max + pad];
  // Post markers ride just inside the bottom edge, below the data, in both views.
  const markerY = domain[0] + pad * 0.4;

  const spikes = isChange ? findSpikes(data.map((p) => p.change)) : new Set<number>();
  const hasAnyPosts = postsByDate ? data.some((p) => (postsByDate[p.date]?.count ?? 0) > 0) : false;
  const chartData = data.map((point, index) => ({
    ...point,
    marker: postsByDate?.[point.date]?.count ? markerY : null,
    // On the row: recharts skips null bars, so a label index would drift from the data index.
    spike: spikes.has(index) ? point.change : null,
  }));

  const formatDate = (value: string) =>
    formatShortDate(value, locale, timeZone, { year: withYear });
  // Follower counts move by single digits against a four-figure total, so the
  // compact format would collapse every tick to the same "1.6k".
  const formatCount = (value: number) => Math.round(value).toLocaleString(locale);
  const formatSigned = (value: number) => `${value > 0 ? "+" : ""}${value.toLocaleString(locale)}`;

  const tooltipRows = (point: (typeof chartData)[number]): ChartTooltipRow[] => {
    const change = point.change;
    const metricRows: ChartTooltipRow[] = isChange
      ? [
          ...(change !== null
            ? [
                {
                  label: copy.dailyChange,
                  value: formatSigned(change),
                  color: change < 0 ? negativeColor : chartColors.followers,
                },
              ]
            : []),
          { label: copy.followers, value: point.followers.toLocaleString(locale), muted: true },
        ]
      : [
          {
            label: copy.followers,
            value: point.followers.toLocaleString(locale),
            color: chartColors.followers,
          },
          ...(change !== null
            ? [{ label: copy.dailyChange, value: formatSigned(change), muted: true }]
            : []),
        ];
    const posts = postsByDate?.[point.date];
    if (!posts?.count) return metricRows;
    return [
      ...metricRows,
      {
        label: <span className="text-foreground/80 font-medium">{copy.postsThatDay}</span>,
        value: posts.count,
        color: MARKER_COLOR,
      },
      ...posts.top.map((post) => ({
        label: <span className="pl-3.5">{truncate(post.text) || post.id}</span>,
        value: `${formatCompactNumber(post.views)} ${copy.views}`,
        muted: true,
      })),
      ...(posts.count > posts.top.length
        ? [
            {
              label: <span className="pl-3.5">+{posts.count - posts.top.length}</span>,
              value: "",
              muted: true,
            },
          ]
        : []),
    ];
  };

  const sharedX = {
    dataKey: "date",
    tick: axisTick,
    tickLine: false,
    axisLine: false,
    interval: "preserveStartEnd" as const,
  };

  return (
    <>
      <AxisHint x={copy.date} y={isChange ? copy.dailyChange : copy.followers} />
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <ChartLegend
          items={[
            isChange
              ? { label: copy.dailyChange, color: chartColors.followers, shape: "dot" as const }
              : { label: copy.followers, color: chartColors.followers, shape: "line" as const },
            ...(hasAnyPosts
              ? [{ label: copy.posted, color: MARKER_COLOR, shape: "dot" as const }]
              : []),
          ]}
        />
        <SegmentedControl
          value={mode}
          onChange={setMode}
          options={modeOptions}
          label={copy.viewMode}
        />
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={chartData} margin={compactChartMargin}>
          <ChartAreaGradient id="follower-trend-fill" color={chartColors.followers} />
          <CartesianGrid {...gridProps} />
          <XAxis {...sharedX} tickFormatter={formatDate} />
          <YAxis
            domain={domain}
            tickFormatter={isChange ? formatSigned : formatCount}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={Y_AXIS_WIDTH}
          />
          <Tooltip
            cursor={isChange ? barCursor : lineCursor}
            filterNull={false}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as (typeof chartData)[number] | undefined;
              if (!point) return null;
              return <ChartTooltip title={formatDate(label as string)} rows={tooltipRows(point)} />;
            }}
          />
          {isChange && <ReferenceLine y={0} stroke={chartColors.axis} strokeOpacity={0.4} />}
          {isChange && (
            <Bar
              dataKey="change"
              name={copy.dailyChange}
              radius={barRadius}
              maxBarSize={28}
              {...motion}
            >
              {chartData.map((point) => (
                <Cell
                  key={point.date}
                  fill={(point.change ?? 0) < 0 ? negativeColor : chartColors.followers}
                />
              ))}
              <LabelList
                dataKey="spike"
                content={(props) => {
                  const { x, y, width, height, value } = props as {
                    x?: number;
                    y?: number;
                    width?: number;
                    height?: number;
                    value?: number | null;
                  };
                  if (value == null || x == null || y == null || width == null || height == null) {
                    return null;
                  }
                  const above = value >= 0;
                  return (
                    <text
                      x={x + width / 2}
                      y={above ? Math.min(y, y + height) - 4 : Math.max(y, y + height) + 11}
                      textAnchor="middle"
                      fontSize={10}
                      fontWeight={600}
                      fill={above ? chartColors.followers : negativeColor}
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {formatSigned(value)}
                    </text>
                  );
                }}
              />
            </Bar>
          )}
          {!isChange && (
            <Area
              type="monotone"
              dataKey="followers"
              stroke="none"
              fill="url(#follower-trend-fill)"
              activeDot={false}
              tooltipType="none"
              {...motion}
            />
          )}
          {!isChange && (
            <Line
              type="monotone"
              dataKey="followers"
              name={copy.followers}
              stroke={chartColors.followers}
              strokeWidth={2}
              dot={false}
              activeDot={activeDot(chartColors.followers)}
              {...motion}
            />
          )}
          {hasAnyPosts && (
            <Scatter
              dataKey="marker"
              name={copy.posted}
              fill={MARKER_COLOR}
              tooltipType="none"
              shape={(props: { cx?: number; cy?: number }) =>
                props.cx != null && props.cy != null ? (
                  <circle cx={props.cx} cy={props.cy} r={2.5} fill={MARKER_COLOR} />
                ) : (
                  <g />
                )
              }
              {...motion}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
}
