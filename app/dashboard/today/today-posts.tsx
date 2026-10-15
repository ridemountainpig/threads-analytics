import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PostGrowthChart, { type PostGrowthChartLabels } from "@/components/charts/post-growth-chart";
import { VsTypicalBadge } from "@/components/dashboard/post-pace";
import { formatAge, type AgeLabels } from "@/lib/post-growth";
import type { TodayPost } from "@/lib/today-data";
import { cn, normalizeIntlSpaces } from "@/lib/utils";
import CollapsibleCard from "./collapsible-card";
import ExpandableText from "./expandable-text";

const HOUR_MS = 60 * 60 * 1000;

export interface TodayPostsLabels {
  postsTitle: string;
  postsSub: string;
  noPostsYet: string;
  showMore: string;
  showLess: string;
  views: string;
  likes: string;
  replies: string;
  reposts: string;
  quotes: string;
  shares: string;
  engRate: string;
  medianTitle: string;
  medianSub: string;
  gainTitle: string;
  gainValue: string;
  gainSub: string;
  yesterdayTitle: string;
  yesterdaySub: string;
  gainsUnknown: string;
  typicalValue: string;
  velocityTitle: string;
  velocityValue: string;
  velocitySub: string;
  paceTitle: string;
  growthTitle: string;
  growthPending: string;
  threadParts: string;
  partLabel: string;
  partOfRoot: string;
  typicalNote: string;
  postedAgo: string;
  viewOnThreads: string;
  threadBadge: string;
  noText: string;
}

const titleClass = "text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase";

function formatTime(iso: string, locale: string, timeZone: string) {
  return normalizeIntlSpaces(
    new Intl.DateTimeFormat(locale, {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso)),
  );
}

function postedAgo(iso: string, now: number, ageLabels: AgeLabels, locale: string) {
  const hours = Math.max(0, now - new Date(iso).getTime()) / HOUR_MS;
  return formatAge(hours >= 1 ? Math.floor(hours) : hours, ageLabels, locale);
}

const percent = (value: number, total: number) =>
  total > 0 ? Math.round((value / total) * 100) : null;

function PostCard({
  post,
  medianViews,
  medianEngagementRate,
  now,
  labels,
  ageLabels,
  growthLabels,
  locale,
  timeZone,
}: {
  post: TodayPost;
  medianViews: number;
  medianEngagementRate: number | null;
  now: number;
  labels: TodayPostsLabels;
  ageLabels: AgeLabels;
  growthLabels: PostGrowthChartLabels;
  locale: string;
  timeZone: string;
}) {
  const engagement = post.likes + post.replies + post.reposts + post.quotes;
  const engRate = post.views > 0 ? ((engagement / post.views) * 100).toFixed(2) : "0.00";
  const metrics = [
    { label: labels.views, value: post.views.toLocaleString(locale) },
    { label: labels.likes, value: post.likes.toLocaleString(locale) },
    { label: labels.replies, value: post.replies.toLocaleString(locale) },
    { label: labels.reposts, value: post.reposts.toLocaleString(locale) },
    { label: labels.quotes, value: post.quotes.toLocaleString(locale) },
    { label: labels.shares, value: post.shares.toLocaleString(locale) },
    { label: labels.engRate, value: `${engRate}%` },
  ];
  const ofMedian = percent(post.views, medianViews);
  const pace = post.pace;
  // One reading would draw an unmeasured straight line.
  const showCurve = pace !== null && pace.readings >= 2;
  // Keeps the median tick on the bar once the post passes it.
  const scale = Math.max(100, ofMedian ?? 0);
  const [before, latest] = showCurve ? pace.curve.slice(-2) : [];
  const perHour =
    before && latest && latest.ageHours > before.ageHours
      ? Math.round((latest.views - before.views) / (latest.ageHours - before.ageHours))
      : null;
  const comparisons = [
    ...(post.gainedToday
      ? [
          {
            label: labels.gainTitle,
            value: labels.gainValue.replace(
              "{value}",
              post.gainedToday.views.toLocaleString(locale),
            ),
            sub: labels.gainSub
              .replace("{likes}", post.gainedToday.likes.toLocaleString(locale))
              .replace("{replies}", post.gainedToday.replies.toLocaleString(locale)),
          },
        ]
      : []),
    {
      label: labels.engRate,
      value: `${engRate}%`,
      sub:
        medianEngagementRate !== null
          ? labels.typicalValue.replace("{value}", `${medianEngagementRate.toFixed(2)}%`)
          : null,
    },
    ...(perHour !== null
      ? [
          {
            label: labels.velocityTitle,
            value: labels.velocityValue.replace("{value}", perHour.toLocaleString(locale)),
            sub: labels.velocitySub,
          },
        ]
      : []),
    ...(pace?.typical != null
      ? [
          {
            label: labels.paceTitle.replace(
              "{age}",
              formatAge(pace.readingAgeHours, ageLabels, locale),
            ),
            value: pace.typical.toLocaleString(locale),
            sub: null,
          },
        ]
      : []),
  ];

  return (
    <article className="space-y-5 border-b py-6 first:pt-0 last:border-0 last:pb-0">
      <div className="space-y-2">
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="tabular-nums">
            {formatTime(post.postedAt, locale, timeZone)} ·{" "}
            {labels.postedAgo.replace("{age}", postedAgo(post.postedAt, now, ageLabels, locale))}
          </span>
          {post.parts.length > 0 && (
            <span className="bg-muted rounded-full px-2.5 py-0.5 text-xs font-medium">
              {labels.threadBadge.replace("{count}", String(post.parts.length + 1))}
            </span>
          )}
          {pace?.vsTypical != null && <VsTypicalBadge vsTypical={pace.vsTypical} />}
          {post.permalink && (
            <a
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-tint -my-3 flex min-h-11 items-center gap-1 transition-opacity duration-150 hover:opacity-80 active:opacity-60 motion-reduce:transition-none sm:ml-auto"
            >
              <ExternalLink className="size-3.5" />
              {labels.viewOnThreads}
            </a>
          )}
        </div>
        <ExpandableText
          text={post.text || labels.noText}
          className="text-[15px] leading-relaxed"
          labels={{ more: labels.showMore, less: labels.showLess }}
        />
      </div>

      <dl className="border-border/60 sm:divide-border/60 grid grid-cols-4 gap-y-4 border-y py-4 sm:grid-cols-7 sm:divide-x">
        {metrics.map(({ label, value }) => (
          <div key={label} className="min-w-0 sm:px-4 sm:first:pl-0 sm:last:pr-0">
            <dt className="text-muted-foreground truncate text-[11px] leading-4 font-semibold tracking-[0.08em] uppercase">
              {label}
            </dt>
            <dd className="mt-1 text-lg leading-6 font-semibold tracking-[-0.01em] tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="min-w-0">
          <p className={cn(titleClass, "mb-2")}>{labels.growthTitle}</p>
          {showCurve ? (
            <PostGrowthChart
              curve={pace.curve}
              labels={growthLabels}
              dateLocale={locale}
              height={160}
            />
          ) : (
            <div className="text-muted-foreground flex h-40 items-center justify-center rounded-lg border border-dashed px-4 text-center text-sm">
              {labels.growthPending}
            </div>
          )}
        </div>

        <div className="md:border-border/60 flex min-w-0 flex-col md:border-l md:pl-6">
          {ofMedian !== null && (
            <div>
              <p className={titleClass}>{labels.medianTitle}</p>
              <p className="mt-1 text-2xl leading-8 font-semibold tracking-[-0.01em] tabular-nums">
                {ofMedian.toLocaleString(locale)}%
              </p>
              <div className="relative mt-2">
                <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      ofMedian >= 100 ? "bg-green-600" : "bg-tint",
                    )}
                    style={{ width: `${(ofMedian / scale) * 100}%` }}
                  />
                </div>
                <span
                  aria-hidden
                  className="bg-foreground/50 absolute -top-1 h-3.5 w-0.5 -translate-x-1/2 rounded-full"
                  style={{ left: `${(100 / scale) * 100}%` }}
                />
              </div>
              <p className="text-muted-foreground mt-2 text-xs">
                {labels.medianSub.replace("{median}", medianViews.toLocaleString(locale))}
              </p>
            </div>
          )}

          <dl
            className={cn(
              "divide-border/60 divide-y",
              ofMedian !== null && "border-border/60 mt-4 border-t",
            )}
          >
            {comparisons.map(({ label, value, sub }) => (
              <div key={label} className="flex items-baseline justify-between gap-3 py-2.5">
                <dt className="text-muted-foreground min-w-0 text-xs">{label}</dt>
                <dd className="shrink-0 text-right">
                  <span className="text-sm font-semibold tabular-nums">{value}</span>
                  {sub && (
                    <span className="text-muted-foreground block text-[11px] leading-4 tabular-nums">
                      {sub}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {post.parts.length > 0 && (
        <div className="border-border/60 border-t pt-4">
          <p className={titleClass}>{labels.threadParts}</p>
          <ul className="divide-border/60 mt-1 divide-y">
            {post.parts.map((part) => {
              const share = percent(part.views, post.views);
              return (
                <li key={part.id} className="flex items-baseline gap-3 py-2.5 text-sm last:pb-0">
                  <span className="text-muted-foreground w-14 shrink-0 text-xs">
                    {labels.partLabel.replace("{n}", String(part.position))}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{part.text || labels.noText}</span>
                  <span className="shrink-0 text-xs tabular-nums">
                    {part.views.toLocaleString(locale)} {labels.views}
                    {share !== null && (
                      <span className="text-muted-foreground">
                        {" · "}
                        {labels.partOfRoot.replace("{pct}", String(share))}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </article>
  );
}

interface PostListProps {
  posts: TodayPost[];
  typicalSample: number;
  medianViews: number;
  medianEngagementRate: number | null;
  now: number;
  labels: TodayPostsLabels;
  ageLabels: AgeLabels;
  growthLabels: PostGrowthChartLabels;
  locale: string;
  timeZone: string;
}

function PostList({ posts, typicalSample, ...card }: PostListProps) {
  const hasTypical = posts.some((post) => post.pace?.typical != null);
  return (
    <>
      <div>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} {...card} />
        ))}
      </div>
      {hasTypical && (
        <p className="text-muted-foreground mt-6 border-t pt-3 text-xs">
          {card.labels.typicalNote.replace("{count}", String(typicalSample))}
        </p>
      )}
    </>
  );
}

export function TodayPostsCard(props: PostListProps) {
  const { posts, labels } = props;
  return (
    <Card>
      <CardHeader>
        <CardTitle className={titleClass}>{labels.postsTitle}</CardTitle>
        <p className="text-muted-foreground text-xs">{labels.postsSub}</p>
      </CardHeader>
      <CardContent>
        {posts.length > 0 ? (
          <PostList {...props} />
        ) : (
          <p className="text-muted-foreground py-2 text-sm">{labels.noPostsYet}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function YesterdayPostsCard(props: PostListProps) {
  const { posts, labels, locale } = props;
  const anyGain = posts.some((post) => post.gainedToday);
  return (
    <CollapsibleCard
      title={`${labels.yesterdayTitle} · ${posts.length.toLocaleString(locale)}`}
      subtitle={labels.yesterdaySub}
    >
      <PostList {...props} />
      {!anyGain && (
        <p className="text-muted-foreground mt-6 border-t pt-3 text-xs">{labels.gainsUnknown}</p>
      )}
    </CollapsibleCard>
  );
}
