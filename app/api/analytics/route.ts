import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession, unauthorizedResponse } from "@/lib/api-auth";
import { getUserInsights, TokenExpiredError } from "@/lib/threads-api";
import { decryptToken } from "@/lib/crypto";
import {
  computeBestTimeToPost,
  computeContentTypeAnalysis,
  computeDailyPerformance,
  computeDayHourHeatmap,
  computeEngagementRateTrend,
  computeActionFunnel,
  computeContentFormatLengthMatrix,
  computePostLengthAnalysis,
  computePostQualityScatter,
  computePostingConsistency,
  computeReplyRateLeaders,
  computeSharesTrend,
  computeTopHours,
  computeViralPosts,
  computeWeeklyFrequency,
  type AnalyticsResult,
  type PostWithInsights,
} from "@/lib/analytics";

export async function GET(request: NextRequest) {
  if (!(await requireApiSession())) return unauthorizedResponse();

  const { searchParams } = request.nextUrl;
  const sinceParam = searchParams.get("since");
  const untilParam = searchParams.get("until");

  const sinceTs = sinceParam ? Number(sinceParam) : null;
  const untilTs = untilParam ? Number(untilParam) : null;

  if (
    (sinceTs !== null && !Number.isFinite(sinceTs)) ||
    (untilTs !== null && !Number.isFinite(untilTs))
  ) {
    return NextResponse.json({ error: "Invalid date parameters" }, { status: 400 });
  }

  const until = untilTs !== null ? new Date(untilTs * 1000) : new Date();
  const since =
    sinceTs !== null ? new Date(sinceTs * 1000) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const account = await db.threadsAccount.findFirst({
    where: { isActive: true },
    include: { syncState: true },
  });

  if (!account) {
    return NextResponse.json({ error: "No active account" }, { status: 404 });
  }

  let accessToken: string;
  try {
    accessToken = decryptToken(account.accessToken);
  } catch {
    return NextResponse.json(
      { error: "Account credentials are unavailable. Please reconnect this account." },
      { status: 500 },
    );
  }

  // Fetch user-level insights from Threads API
  let userInsights;
  try {
    userInsights = await getUserInsights(
      account.id,
      accessToken,
      Math.floor(since.getTime() / 1000),
      Math.floor(until.getTime() / 1000),
    );
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return NextResponse.json({ error: "token_expired" }, { status: 401 });
    }
    console.error("[analytics] getUserInsights failed, using empty fallback:", err);
    userInsights = { views: [], totalLikes: 0, totalReplies: 0, totalReposts: 0, totalQuotes: 0 };
  }

  // Fetch cached posts from DB
  const dbPosts = await db.post.findMany({
    where: {
      accountId: account.id,
      timestamp: { gte: since, lte: until },
      mediaType: { not: "REPOST_FACADE" },
    },
    orderBy: { timestamp: "desc" },
  });

  const posts: PostWithInsights[] = dbPosts.map((p) => ({
    id: p.id,
    text: p.text,
    timestamp: p.timestamp,
    mediaType: p.mediaType,
    permalink: p.permalink,
    views: p.views,
    likes: p.likes,
    replies: p.replies,
    reposts: p.reposts,
    quotes: p.quotes,
    shares: p.shares,
  }));

  const totalShares = posts.reduce((sum, p) => sum + p.shares, 0);
  const bestTimeToPost = computeBestTimeToPost(posts);
  const dailyPerformance = computeDailyPerformance(posts, userInsights.views);

  const result: AnalyticsResult = {
    userViews: userInsights.views,
    dailyPerformance,
    totalEngagement: {
      likes: userInsights.totalLikes,
      replies: userInsights.totalReplies,
      reposts: userInsights.totalReposts,
      quotes: userInsights.totalQuotes,
      shares: totalShares,
    },
    bestTimeToPost,
    contentTypeAnalysis: computeContentTypeAnalysis(posts),
    dayHourHeatmap: computeDayHourHeatmap(posts),
    postLengthAnalysis: computePostLengthAnalysis(posts),
    weeklyFrequency: computeWeeklyFrequency(posts),
    postQualityScatter: computePostQualityScatter(posts),
    contentFormatLengthMatrix: computeContentFormatLengthMatrix(posts),
    actionFunnel: computeActionFunnel(posts),
    viralPosts: computeViralPosts(posts),
    engagementRateTrend: computeEngagementRateTrend(posts, userInsights.views),
    replyRateLeaders: computeReplyRateLeaders(posts),
    sharesTrend: computeSharesTrend(posts),
    postingConsistency: computePostingConsistency(posts, since, until),
    topHours: computeTopHours(bestTimeToPost),
    lastSyncedAt: account.syncState?.lastSyncedAt?.toISOString(),
  };

  return NextResponse.json(result);
}
