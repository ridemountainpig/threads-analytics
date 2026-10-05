import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { chartColors } from "@/components/charts/chart-style";
import { ChartLegend } from "@/components/charts/chart-chrome";
import { formatAge, type AgeLabels } from "@/lib/post-growth";
import type { NewPostPace } from "@/lib/post-growth-data";
import { cn } from "@/lib/utils";

interface NewPostPaceCardProps {
  posts: NewPostPace[];
  typicalSample: number;
  locale: string;
  labels: {
    title: string;
    subtitle: string;
    /** e.g. "{age} in" */
    ageIn: string;
    views: string;
    /** e.g. "typical {value}" */
    typical: string;
    note: string;
    noText: string;
    thisPost: string;
    typicalPost: string;
  };
  ageLabels: AgeLabels;
}

const VIEW_W = 100;
const VIEW_H = 28;

// The post's views so far against the typical post's at the same ages, on one
// shared scale so the gap between the lines is the story. Gaps in the typical
// line are ages too few older posts were read at.
function PaceSparkline({ curve }: { curve: NewPostPace["curve"] }) {
  const maxX = Math.max(...curve.map((p) => p.ageHours), 1e-6);
  const maxY = Math.max(1, ...curve.map((p) => Math.max(p.views, p.typical ?? 0)));
  const pad = 2;
  const x = (h: number) => ((h / maxX) * VIEW_W).toFixed(2);
  const y = (v: number) => (pad + (1 - v / maxY) * (VIEW_H - pad * 2)).toFixed(2);

  const path = (values: Array<number | null>) => {
    let d = "";
    let drawing = false;
    values.forEach((value, i) => {
      if (value === null) {
        drawing = false;
        return;
      }
      d += `${drawing ? "L" : "M"}${x(curve[i].ageHours)} ${y(value)} `;
      drawing = true;
    });
    return d.trim();
  };

  const stroke = {
    fill: "none",
    strokeWidth: 1.5,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
    vectorEffect: "non-scaling-stroke" as const,
  };

  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="none"
      className="h-7 w-full overflow-visible"
    >
      <path
        d={path(curve.map((p) => p.typical))}
        stroke={chartColors.trend}
        strokeDasharray="3 2"
        {...stroke}
      />
      <path d={path(curve.map((p) => p.views))} stroke={chartColors.views} {...stroke} />
    </svg>
  );
}

export function NewPostPaceCard({
  posts,
  typicalSample,
  locale,
  labels,
  ageLabels,
}: NewPostPaceCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
          {labels.title}
        </CardTitle>
        <p className="text-muted-foreground text-xs">{labels.subtitle}</p>
        <ChartLegend
          className="hidden pt-1 sm:flex"
          items={[
            { label: labels.thisPost, color: chartColors.views, shape: "line" },
            { label: labels.typicalPost, color: chartColors.trend, shape: "dash" },
          ]}
        />
      </CardHeader>
      <CardContent>
        <div>
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/dashboard/posts?post=${encodeURIComponent(post.id)}`}
              className="hover:bg-muted/50 -mx-2 flex items-center gap-4 rounded-lg border-b px-2 py-3 transition-colors last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm">{post.text || labels.noText}</p>
                <p className="text-muted-foreground mt-1 text-xs tabular-nums">
                  {labels.ageIn.replace(
                    "{age}",
                    formatAge(post.readingAgeHours, ageLabels, locale),
                  )}
                  {" · "}
                  {post.views.toLocaleString(locale)} {labels.views}
                  {" · "}
                  {labels.typical.replace("{value}", post.typical.toLocaleString(locale))}
                </p>
              </div>
              <div className="hidden w-24 shrink-0 sm:block">
                <PaceSparkline curve={post.curve} />
              </div>
              {post.vsTypical !== null && (
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums",
                    post.vsTypical >= 1
                      ? "bg-green-600/10 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                      : "bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400",
                  )}
                >
                  <svg
                    aria-hidden
                    width="7"
                    height="7"
                    viewBox="0 0 8 8"
                    className={cn("shrink-0", post.vsTypical < 1 && "rotate-180")}
                  >
                    <path d="M4 0.5 L7.5 6.5 L0.5 6.5 Z" fill="currentColor" />
                  </svg>
                  {post.vsTypical}x
                </span>
              )}
            </Link>
          ))}
        </div>
        <p className="text-muted-foreground pt-3 text-xs">
          {labels.note.replace("{count}", String(typicalSample))}
        </p>
      </CardContent>
    </Card>
  );
}
