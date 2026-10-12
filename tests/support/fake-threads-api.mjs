// A stand-in for graph.threads.net, installed over globalThis.fetch by tests
// that drive lib/threads-api.ts. It serves the endpoints a sync calls from
// plain data, fails the ones a test asks it to, and records every request so
// a test can check which endpoints were called, and with which token.

const METRIC_NAMES = ["views", "likes", "replies", "reposts", "quotes", "shares"];

/** Meta's error for an expired or revoked token (code 190). */
export const expiredToken = () => ({
  status: 400,
  body: { error: { code: 190, message: "Error validating access token: Session has expired" } },
});

/** What /replies answers a token minted without threads_read_replies. */
export const missingReplyPermission = () => ({
  status: 403,
  body: {
    error: {
      code: 10,
      message: "(#10) Application does not have permission for this action: threads_read_replies",
    },
  },
});

export const serverError = () => ({
  status: 500,
  body: { error: { code: 2, message: "Unknown" } },
});

export function createThreadsApi({ pageSize = 100 } = {}) {
  const api = {
    /** Posts as /threads lists them: { id, text, timestamp, media_type, permalink }. */
    posts: [],
    /** Post or reply id → { views, likes, ... }; unlisted ids read as all zero. */
    insights: new Map(),
    /** Replies as /replies lists them, with root_post and replied_to. */
    replies: [],
    followersCount: 1000,
    /** breakdown → [{ key, value }]. */
    demographics: {
      country: [{ key: "TW", value: 700 }],
      city: [{ key: "Taipei, Taiwan", value: 400 }],
      age: [{ key: "25-34", value: 500 }],
      gender: [{ key: "F", value: 550 }],
    },
    refreshed: { access_token: "THAAG-renewed", expires_in: 60 * 24 * 60 * 60 },
    /** Endpoint key → { status, body } to answer with instead (see `keyOf`). */
    failures: new Map(),
    /** Every request made, as { key, url }. */
    requests: [],

    /** Requests made to one endpoint key. */
    calls(key) {
      return api.requests.filter((request) => request.key === key);
    },

    async fetch(input) {
      const url = new URL(String(input));
      const key = keyOf(url);
      api.requests.push({ key, url });
      const failure = api.failures.get(key);
      if (failure) return respond(failure.status, failure.body);

      switch (key.split(":")[0]) {
        case "refresh":
          return respond(200, api.refreshed);
        case "threads":
          return respond(200, page(api.posts, url));
        case "replies": {
          const since = url.searchParams.get("since");
          const replies = since
            ? api.replies.filter((reply) => Date.parse(reply.timestamp) >= Number(since) * 1000)
            : api.replies;
          return respond(200, page(replies, url));
        }
        case "insights": {
          const metrics = api.insights.get(key.slice("insights:".length)) ?? {};
          return respond(200, {
            data: METRIC_NAMES.map((name) => ({ name, values: [{ value: metrics[name] ?? 0 }] })),
          });
        }
        case "followers_count":
          return respond(200, {
            data: [{ name: "followers_count", total_value: { value: api.followersCount } }],
          });
        case "follower_demographics": {
          const entries = api.demographics[url.searchParams.get("breakdown")] ?? [];
          const results = entries.map(({ key: value, value: count }) => ({
            dimension_values: [value],
            value: count,
          }));
          return respond(200, {
            data: [{ name: "follower_demographics", total_value: { breakdowns: [{ results }] } }],
          });
        }
        default:
          return respond(404, { error: { code: 803, message: `No fake for ${url.pathname}` } });
      }
    },
  };

  function page(items, url) {
    const start = Number(url.searchParams.get("after") ?? 0);
    const end = start + pageSize;
    const more = end < items.length;
    return {
      data: items.slice(start, end),
      ...(more && { paging: { cursors: { after: String(end) }, next: `${url}&after=${end}` } }),
    };
  }

  return api;
}

/**
 * Names the endpoint a request is for: "refresh", "threads", "replies",
 * "insights:<id>", "followers_count" or "follower_demographics:<breakdown>".
 */
function keyOf(url) {
  if (url.pathname === "/refresh_access_token") return "refresh";
  const [, , id, edge] = url.pathname.split("/");
  if (edge === "insights") return `insights:${id}`;
  if (edge === "threads_insights") {
    const metric = url.searchParams.get("metric");
    return metric === "follower_demographics"
      ? `follower_demographics:${url.searchParams.get("breakdown")}`
      : metric;
  }
  return edge ?? url.pathname;
}

function respond(status, body) {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
