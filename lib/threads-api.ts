const BASE_URL = "https://graph.threads.net/v1.0";

export interface ThreadsUser {
  id: string;
  username: string;
}

export interface ThreadsPost {
  id: string;
  text: string;
  timestamp: string;
  media_type: "TEXT" | "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "AUDIO" | "REPOST_FACADE";
  permalink: string;
}

export interface PostInsights {
  views: number;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
  shares: number;
}

export interface UserInsights {
  views: Array<{ end_time: string; value: number }>;
  totalLikes: number;
  totalReplies: number;
  totalReposts: number;
  totalQuotes: number;
}

export class TokenExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenExpiredError";
  }
}

async function apiGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text();
    try {
      const parsed = JSON.parse(body);
      if (parsed?.error?.code === 190) {
        throw new TokenExpiredError(
          parsed.error.message ??
            "Access token has expired. Please reconnect your Threads account.",
        );
      }
    } catch (e) {
      if (e instanceof TokenExpiredError) throw e;
    }
    throw new Error(`Threads API error ${res.status} at ${path}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export async function getUser(accessToken: string): Promise<ThreadsUser> {
  const data = await apiGet<{ id: string; username: string }>("/me", {
    fields: "id,username",
    access_token: accessToken,
  });
  return { id: data.id, username: data.username };
}

export async function getPosts(
  userId: string,
  accessToken: string,
  after?: string,
): Promise<{ posts: ThreadsPost[]; nextCursor?: string }> {
  interface PostsResponse {
    data: Array<{
      id: string;
      text?: string;
      timestamp: string;
      media_type: "TEXT" | "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "AUDIO" | "REPOST_FACADE";
      permalink?: string;
    }>;
    paging?: { cursors?: { after?: string }; next?: string };
  }

  const params: Record<string, string> = {
    fields: "id,text,timestamp,media_type,permalink",
    limit: "100",
    access_token: accessToken,
  };
  if (after) params["after"] = after;

  const data = await apiGet<PostsResponse>(`/${userId}/threads`, params);

  const posts: ThreadsPost[] = (data.data ?? [])
    .filter((p) => p.media_type !== "REPOST_FACADE")
    .map((p) => ({
      id: p.id,
      text: p.text ?? "",
      timestamp: p.timestamp,
      media_type: p.media_type ?? "TEXT",
      permalink: p.permalink ?? "",
    }));

  const nextCursor =
    data.paging?.cursors?.after && data.paging.next ? data.paging.cursors.after : undefined;
  return { posts, nextCursor };
}

export async function getPostInsights(
  postId: string,
  accessToken: string,
): Promise<PostInsights | null> {
  interface InsightsResponse {
    data: Array<{
      name: string;
      values?: Array<{ value: number }>;
      total_value?: { value: number };
    }>;
  }

  try {
    const data = await apiGet<InsightsResponse>(`/${postId}/insights`, {
      metric: "views,likes,replies,reposts,quotes,shares",
      access_token: accessToken,
    });

    const getValue = (name: string): number => {
      const item = (data.data ?? []).find((d) => d.name === name);
      if (!item) return 0;
      if (item.total_value !== undefined) return item.total_value.value ?? 0;
      if (item.values && item.values.length > 0) return item.values[0]?.value ?? 0;
      return 0;
    };

    return {
      views: getValue("views"),
      likes: getValue("likes"),
      replies: getValue("replies"),
      reposts: getValue("reposts"),
      quotes: getValue("quotes"),
      shares: getValue("shares"),
    };
  } catch (err) {
    if (err instanceof TokenExpiredError) throw err;
    console.warn(
      `[threads-api] getPostInsights failed for ${postId}:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

export async function getUserInsights(
  userId: string,
  accessToken: string,
  since: number,
  until: number,
): Promise<UserInsights> {
  interface InsightsResponse {
    data: Array<{
      name: string;
      period: string;
      values?: Array<{ end_time: string; value: number }>;
      total_value?: { value: number };
      title: string;
    }>;
  }

  const data = await apiGet<InsightsResponse>("/me/threads_insights", {
    metric: "views,likes,replies,reposts,quotes",
    since: String(since),
    until: String(until),
    period: "day",
    access_token: accessToken,
  });

  const getMetric = (name: string) => (data.data ?? []).find((d) => d.name === name);

  const viewsMetric = getMetric("views");
  const views: Array<{ end_time: string; value: number }> =
    viewsMetric?.values?.map((v) => ({ end_time: v.end_time, value: v.value })) ?? [];

  const sumMetric = (name: string): number => {
    const m = getMetric(name);
    if (!m) return 0;
    if (m.total_value !== undefined) return m.total_value.value ?? 0;
    return (m.values ?? []).reduce((acc, v) => acc + (v.value ?? 0), 0);
  };

  return {
    views,
    totalLikes: sumMetric("likes"),
    totalReplies: sumMetric("replies"),
    totalReposts: sumMetric("reposts"),
    totalQuotes: sumMetric("quotes"),
  };
}
