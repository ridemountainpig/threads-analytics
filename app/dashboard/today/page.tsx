import { decryptToken } from "@/lib/crypto";
import { getActiveAccount, getSyncIntervalCached } from "@/lib/dashboard-data";
import {
  getBestPostingHours,
  getTodayBounds,
  getTodayFollowers,
  getTodayInbox,
  getTodayMyReplies,
  getTodayOverall,
  getRecentPosts,
} from "@/lib/today-data";
import { replyRate } from "@/lib/today-replies";
import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import { cn, normalizeIntlSpaces } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import { NoAccountNotice } from "@/components/dashboard/no-account-notice";
import { TokenExpiredNotice } from "@/components/dashboard/token-expired-notice";
import { FirstSyncNotice } from "@/components/dashboard/first-sync-notice";
import PageHeader from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dateLocales, getDictionary } from "@/lib/i18n-server";
import { getServerTimezone } from "@/lib/server-timezone";
import { hourLabeler } from "@/lib/hour-label";
import { STALE_SYNC_DAYS } from "@/lib/stale-sync";
import TodayViews, { type TodayView } from "./today-views";
import { TodayPostsCard, YesterdayPostsCard } from "./today-posts";
import ReplyInbox, { type ReplyInboxProps } from "./reply-inbox";
import MyReplies, { type MyRepliesProps } from "./my-replies";
import RepliesCard from "./replies-card";
import TodayOverallCard from "./today-overall";
import StaleNotice from "./stale-notice";

interface PageProps {
  searchParams: Promise<{ view?: string }>;
}

const STALE_AFTER_MS = 60 * 60 * 1000;
// StaleSyncBanner's threshold: past it, phones already show that amber banner.
const STALE_BANNER_MS = STALE_SYNC_DAYS * 24 * 60 * 60 * 1000;

const titleClass = "text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase";
// Tighter on phones so today's posts start on the first screen.
const tileClassName = "max-sm:gap-2 max-sm:py-0";

export default async function TodayPage({ searchParams }: PageProps) {
  const { view } = await searchParams;
  const [{ locale, t }, account, syncInterval, tz] = await Promise.all([
    getDictionary(),
    getActiveAccount(),
    getSyncIntervalCached(),
    getServerTimezone(),
  ]);
  const dateLocale = dateLocales[locale];

  if (!account) {
    return (
      <NoAccountNotice
        message={t.common.noAccount}
        help={t.common.noAccountHelp}
        settingsLabel={t.common.settings}
      />
    );
  }

  if (account.expiresAt < new Date()) {
    return (
      <TokenExpiredNotice
        message={t.common.tokenExpired}
        help={t.common.tokenExpiredHelp}
        settingsLabel={t.common.settings}
      />
    );
  }

  const lastSyncedAt = account.syncState?.lastSyncedAt;
  if (!lastSyncedAt) {
    return (
      <FirstSyncNotice
        labels={{
          message: t.common.notSynced,
          help: t.common.notSyncedHelp,
          syncNow: t.common.syncNow,
          syncing: t.sync.syncing,
          inProgress: t.sync.inProgress,
          tokenExpired: t.sync.tokenExpired,
          failed: t.sync.failed,
          synced: t.sync.synced,
        }}
      />
    );
  }

  let accessToken: string;
  try {
    accessToken = decryptToken(account.accessToken);
  } catch {
    return (
      <TokenExpiredNotice
        message={t.common.credentialsUnavailable}
        help={t.common.tokenExpiredHelp}
        settingsLabel={t.common.settings}
      />
    );
  }

  const now = new Date();
  const bounds = getTodayBounds(tz, now);
  const [recentPosts, followers, bestHours] = await Promise.all([
    getRecentPosts(account.id, bounds),
    getTodayFollowers(account.id, accessToken, now),
    getBestPostingHours(account.id, tz, now),
  ]);
  const { today: posts, yesterday: yesterdayPosts } = recentPosts;
  const inboxPosts = [...posts, ...yesterdayPosts];
  const [inbox, myReplies, overall] = await Promise.all([
    getTodayInbox(
      account.id,
      accessToken,
      inboxPosts.map((post) => post.id),
      bounds.todayStart,
    ),
    getTodayMyReplies(account.id, accessToken, bounds.todayStart),
    getTodayOverall(account.id, accessToken, tz, bounds, posts, now),
  ]);

  const number = (value: number) => Math.round(value).toLocaleString(dateLocale);
  const time = (date: Date) =>
    normalizeIntlSpaces(
      new Intl.DateTimeFormat(dateLocale, {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
      }).format(date),
    );
  const hourLabel = hourLabeler(dateLocale);

  const subtitle = new Intl.DateTimeFormat(dateLocale, {
    timeZone: tz,
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(now);
  const syncedAtLabel = normalizeIntlSpaces(
    new Intl.DateTimeFormat(dateLocale, {
      timeZone: tz,
      ...(lastSyncedAt < bounds.todayStart ? { month: "numeric", day: "numeric" } : {}),
      hour: "2-digit",
      minute: "2-digit",
    }).format(lastSyncedAt),
  );
  const syncAge = now.getTime() - lastSyncedAt.getTime();
  const isStale = syncAge > STALE_AFTER_MS;

  const views = posts.reduce((sum, post) => sum + post.views, 0);
  const engagement = posts.reduce(
    (sum, post) => sum + post.likes + post.replies + post.reposts + post.quotes,
    0,
  );
  const engagementRate = views > 0 ? `${((engagement / views) * 100).toFixed(2)}%` : null;
  const engagementSub =
    engagementRate === null
      ? undefined
      : recentPosts.medianEngagementRate === null
        ? t.today.engagementRateOnly.replace("{rate}", engagementRate)
        : t.today.engagementSub
            .replace("{rate}", engagementRate)
            .replace("{typical}", `${recentPosts.medianEngagementRate.toFixed(2)}%`);

  const currentHour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hourCycle: "h23" }).format(
      now,
    ),
  );
  const topHours = bestHours.slots.map((slot) => slot.hour);
  const laterToday = topHours.find((hour) => hour > currentHour);
  const nextHour = laterToday ?? topHours[0];
  const nextBestHour =
    laterToday !== undefined
      ? hourLabel(laterToday)
      : topHours.length > 0
        ? t.today.tomorrow.replace("{time}", hourLabel(topHours[0]!))
        : null;

  const postText = new Map(inboxPosts.map((post) => [post.id, post.text]));
  const inboxLabels = {
    ...t.today,
    viewOnThreads: t.postsPage.viewOnThreads,
    noText: t.postsPage.noText,
    openSettings: t.sync.goToSettings,
    tryAgain: t.common.tryAgain,
  };
  const inboxProps: ReplyInboxProps =
    inbox.status === "ok"
      ? {
          status: "ok",
          replies: inbox.inbox.replies.map((reply) => ({
            ...reply,
            postText: postText.get(reply.postId) ?? "",
          })),
          awaiting: inbox.inbox.awaiting,
          answered: inbox.inbox.answered,
          // MyReplies shows the full count; this narrower one would contradict it.
          authorReplies: myReplies.status === "ok" ? 0 : inbox.inbox.authorReplies,
          replyRate: replyRate(inbox.inbox),
          failedPosts: inbox.failedPosts,
          labels: inboxLabels,
          locale: dateLocale,
          timeZone: tz,
        }
      : {
          status: "unavailable",
          reason: inbox.status,
          message:
            inbox.status === "missing_permission"
              ? t.today.repliesMissingPermission
              : inbox.status === "token_expired"
                ? t.today.repliesTokenExpired
                : t.today.repliesFailed,
          labels: inboxLabels,
        };
  const myRepliesLabels = {
    ...t.today,
    viewOnThreads: t.postsPage.viewOnThreads,
    noText: t.postsPage.noText,
    tryAgain: t.common.tryAgain,
  };
  const myRepliesProps: MyRepliesProps =
    myReplies.status === "ok"
      ? {
          status: "ok",
          replies: myReplies.replies,
          truncated: myReplies.truncated,
          labels: myRepliesLabels,
          locale: dateLocale,
          timeZone: tz,
        }
      : {
          status: "unavailable",
          retry: myReplies.status === "failed",
          message:
            myReplies.status === "missing_permission"
              ? t.today.repliesMissingPermission
              : myReplies.status === "token_expired"
                ? t.today.repliesTokenExpired
                : t.today.repliesFailed,
          labels: myRepliesLabels,
        };
  const awaiting = inbox.status === "ok" ? inbox.inbox.awaiting : 0;
  const postCardProps = {
    typicalSample: recentPosts.typicalSample,
    medianViews: recentPosts.medianViews,
    medianEngagementRate: recentPosts.medianEngagementRate,
    now: now.getTime(),
    labels: {
      ...t.today,
      viewOnThreads: t.postsPage.viewOnThreads,
      threadBadge: t.postsPage.threadBadge,
      noText: t.postsPage.noText,
    },
    ageLabels: t.postsPage.growth,
    growthLabels: t.postsPage.growth,
    locale: dateLocale,
    timeZone: tz,
  };
  const initialView: TodayView = view === "replies" ? "replies" : "posts";

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title={t.today.title}
        subtitle={subtitle}
        sync={{
          lastSyncedAt: lastSyncedAt.toISOString(),
          syncInterval,
          timeZone: tz,
          labels: t.sync,
          dateLocale,
        }}
      />

      <StaleNotice
        stale={isStale}
        className={syncAge >= STALE_BANNER_MS ? "max-sm:hidden" : undefined}
        labels={{
          message: t.today.staleNotice.replace("{time}", syncedAtLabel),
          sync: t.sync.sync,
          syncing: t.sync.syncing,
          synced: t.sync.synced,
          failed: t.sync.failed,
          tokenExpired: t.sync.tokenExpired,
          inProgress: t.sync.inProgress,
          goToSettings: t.sync.goToSettings,
          repliesPermissionMissing: t.sync.repliesPermissionMissing,
        }}
      />

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            className={tileClassName}
            title={t.today.postViews}
            value={views}
            sub={
              posts.length === 1
                ? t.today.postsCountOne
                : t.today.postsCount.replace("{count}", number(posts.length))
            }
          />
          <StatCard
            className={tileClassName}
            title={t.today.engagement}
            value={engagement}
            sub={engagementSub}
          />
          {inbox.status === "ok" ? (
            <a
              href="#replies"
              className="group/tile focus-visible:ring-ring/50 relative block rounded-xl transition-transform duration-150 outline-none focus-visible:ring-[3px] active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              <StatCard
                className={cn(
                  tileClassName,
                  "group-hover/tile:bg-muted/40 h-full transition-colors duration-150",
                )}
                title={t.today.awaitingTitle}
                value={awaiting}
                sub={t.today.repliesTodayCount.replace(
                  "{count}",
                  number(inbox.inbox.replies.length),
                )}
              />
              <ChevronRight
                aria-hidden
                className="text-muted-foreground absolute top-4 right-3 size-4"
              />
            </a>
          ) : (
            <StatCard
              className={tileClassName}
              title={t.today.awaitingTitle}
              value="—"
              sub={t.today.repliesUnavailable}
            />
          )}
          <StatCard
            className={tileClassName}
            title={t.today.followers}
            value={
              followers.net === null
                ? (followers.current ?? "—")
                : `${followers.net > 0 ? "+" : ""}${number(followers.net)}`
            }
            sub={
              followers.net === null
                ? t.today.followersPending
                : followers.current !== null
                  ? t.today.followersTotal.replace("{count}", number(followers.current))
                  : undefined
            }
          />
        </div>

        <TodayViews
          initialView={initialView}
          aside={
            <div className="space-y-4">
              <TodayOverallCard
                overall={overall}
                labels={{
                  ...t.today,
                  postViewsEstimated: t.chart.postViewsEstimated,
                  otherViews: t.chart.otherViews,
                  posts: t.chart.posts,
                }}
                locale={dateLocale}
              />
              <Card>
                <CardHeader>
                  <CardTitle className={titleClass}>{t.today.rhythmTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {nextBestHour && (
                    <div>
                      <p className="text-muted-foreground text-xs">{t.today.nextBestHour}</p>
                      <p className="mt-0.5 text-2xl leading-8 font-semibold tracking-[-0.01em] tabular-nums">
                        {nextBestHour}
                      </p>
                    </div>
                  )}
                  {bestHours.slots.length > 0 ? (
                    <p className="text-muted-foreground flex flex-wrap gap-x-2 text-sm tabular-nums">
                      <span>{t.today.bestHours}</span>
                      <span>
                        {bestHours.slots.map(({ hour, postCount }, i) => (
                          <Fragment key={hour}>
                            {i > 0 && " · "}
                            <span
                              className={
                                hour === nextHour ? "text-foreground font-semibold" : undefined
                              }
                            >
                              {hourLabel(hour)}
                            </span>{" "}
                            <span className="text-xs">
                              ({postCount} {t.common.posts})
                            </span>
                          </Fragment>
                        ))}
                      </span>
                    </p>
                  ) : (
                    bestHours.totalPosts > 0 && (
                      <p className="text-muted-foreground text-sm">{t.today.bestHoursUnclear}</p>
                    )
                  )}
                  <p className="text-muted-foreground text-sm tabular-nums">
                    {posts[0]
                      ? t.today.latestPost.replace("{time}", time(new Date(posts[0].postedAt)))
                      : t.today.noPostsToday}
                  </p>
                </CardContent>
              </Card>
            </div>
          }
          labels={{
            posts: t.today.postsTab,
            replies: awaiting > 0 ? `${t.today.repliesTab} · ${awaiting}` : t.today.repliesTab,
          }}
          posts={
            <div className="space-y-4">
              <TodayPostsCard posts={posts} {...postCardProps} />
              {yesterdayPosts.length > 0 && (
                <YesterdayPostsCard posts={yesterdayPosts} {...postCardProps} />
              )}
            </div>
          }
          replies={
            <RepliesCard
              received={<ReplyInbox {...inboxProps} />}
              sent={<MyReplies {...myRepliesProps} />}
              receivedCount={inbox.status === "ok" ? inbox.inbox.replies.length : null}
              sentCount={myReplies.status === "ok" ? myReplies.replies.length : null}
              initialView={
                inbox.status === "ok" &&
                inbox.inbox.replies.length === 0 &&
                myReplies.status === "ok" &&
                myReplies.replies.length > 0
                  ? "sent"
                  : "received"
              }
              labels={t.today}
            />
          }
        />
      </div>
    </div>
  );
}
