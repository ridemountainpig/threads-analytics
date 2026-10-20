import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { chartColors } from "@/components/charts/chart-style";
import type { TodayOverall } from "@/lib/today-data";

// The analytics chart's split fills and legend dots.
const POST_FILL = `color-mix(in oklch, ${chartColors.views} 50%, transparent)`;
const OTHER_FILL = `color-mix(in oklch, ${chartColors.views} 18%, transparent)`;
const OTHER_DOT = `color-mix(in oklch, ${chartColors.views} 60%, var(--card))`;

const titleClass = "text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase";

function Dot({ color }: { color: string }) {
  return (
    <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: color }} />
  );
}

export default function TodayOverallCard({
  overall: { views, split, postCount, avgViewsPerPost },
  labels,
  locale,
}: {
  overall: TodayOverall;
  labels: {
    overallTitle: string;
    overallSub: string;
    overallPostViewsOnly: string;
    overallAvg: string;
    overallViews: string;
    postViewsEstimated: string;
    otherViews: string;
    posts: string;
  };
  locale: string;
}) {
  const number = (value: number) => value.toLocaleString(locale);
  const pct = (part: number) => (views > 0 ? Math.round((part / views) * 100) : 0);
  const rows = split
    ? [
        {
          label: labels.postViewsEstimated,
          value: split.fromPosts,
          fill: POST_FILL,
          dot: chartColors.views,
        },
        { label: labels.otherViews, value: split.other, fill: OTHER_FILL, dot: OTHER_DOT },
      ]
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className={titleClass}>{labels.overallTitle}</CardTitle>
        <p className="text-muted-foreground text-xs">{labels.overallSub}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-muted-foreground text-xs">{labels.overallViews}</p>
          <p className="mt-0.5 text-2xl leading-8 font-semibold tracking-[-0.01em] tabular-nums">
            {number(views)}
          </p>
        </div>

        {split ? (
          <>
            <div aria-hidden className="bg-muted/60 flex h-2 overflow-hidden rounded-full">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="h-full"
                  style={{ width: `${pct(row.value)}%`, background: row.fill }}
                />
              ))}
            </div>
            <ul className="space-y-1 text-sm">
              {rows.map((row) => (
                <li key={row.label} className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Dot color={row.dot} />
                    <span className="truncate">{row.label}</span>
                  </span>
                  <span className="text-muted-foreground shrink-0 tabular-nums">
                    <span className="text-foreground">{number(row.value)}</span> · {pct(row.value)}%
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-muted-foreground text-xs">{labels.overallPostViewsOnly}</p>
        )}

        <div className="flex items-center justify-between gap-3 border-t pt-3 text-sm">
          <span className="flex min-w-0 items-center gap-1.5">
            <Dot color={chartColors.volume} />
            <span className="truncate">{labels.posts}</span>
          </span>
          <span className="text-muted-foreground shrink-0 tabular-nums">
            <span className="text-foreground">{number(postCount)}</span>
            {postCount > 0 && ` · ${labels.overallAvg.replace("{count}", number(avgViewsPerPost))}`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
