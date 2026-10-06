import assert from "node:assert/strict";
import test from "node:test";
import { buildSummary, fill } from "../lib/summary.ts";

// Templates that echo their variables, so each sentence shows which branch
// produced it and what was filled in.
const templates = {
  summaryHeadlineUp: "up views={views} eng={eng}",
  summaryHeadlineViewsUp: "views-up views={views} eng={eng}",
  summaryHeadlineEngUp: "eng-up views={views} eng={eng}",
  summaryHeadlineDown: "down views={views} eng={eng}",
  summaryHeadlineFlat: "flat views={views} posts={posts} eng={eng}",
  summaryPostsMore: "posts-more posts={posts} delta={delta} median={median}",
  summaryPostsFewer: "posts-fewer posts={posts} delta={delta} median={median}",
  summaryPostsSame: "posts-same posts={posts} median={median}",
  summaryFollowersUp: "followers-up net={net} total={total}",
  summaryFollowersDown: "followers-down net={net} total={total}",
  summaryFollowersFlat: "followers-flat total={total}",
  summaryAudience: "audience country={country} share={share}",
  summaryTopPost: "top text={text} multiplier={multiplier}",
};

const input = (overrides = {}) => ({
  totalViews: 12345.6,
  postCount: 8,
  medianViews: 900,
  engagementRate: 3.14159,
  deltaViews: 12.34,
  deltaEngRate: 5,
  deltaPosts: 0,
  followers: null,
  topCountry: null,
  topPost: null,
  ...overrides,
});

const headline = (overrides) => buildSummary(input(overrides), templates, "en-US")[0];

test("fill replaces known placeholders and leaves the rest", () => {
  assert.equal(fill("{a} and {b}, {a} again", { a: 1, b: "two" }), "1 and two, 1 again");
  assert.equal(fill("{missing} stays", {}), "{missing} stays");
});

test("the headline follows the direction of views and engagement", () => {
  assert.equal(headline({}), "up views=12.3 eng=5");
  assert.equal(headline({ deltaViews: -8, deltaEngRate: -2.25 }), "down views=8 eng=2.3");
  assert.equal(headline({ deltaViews: 4, deltaEngRate: -1 }), "views-up views=4 eng=1");
  assert.equal(headline({ deltaViews: -4, deltaEngRate: 1 }), "eng-up views=4 eng=1");
});

test("without a direction to narrate, the headline states the totals", () => {
  const flat = "flat views=12,346 posts=8 eng=3.14";
  assert.equal(headline({ deltaViews: null }), flat);
  assert.equal(headline({ deltaEngRate: null }), flat);
  assert.equal(headline({ deltaViews: 0 }), flat);
  assert.equal(headline({ deltaEngRate: 0 }), flat);
});

test("the posting sentence compares post counts, and is left out without posts", () => {
  const sentences = (overrides) => buildSummary(input(overrides), templates, "en-US");
  assert.equal(sentences({ deltaPosts: 25 })[1], "posts-more posts=8 delta=25 median=900");
  assert.equal(sentences({ deltaPosts: -12.5 })[1], "posts-fewer posts=8 delta=12.5 median=900");
  assert.equal(sentences({ deltaPosts: 0 })[1], "posts-same posts=8 median=900");
  assert.equal(sentences({ deltaPosts: null })[1], "posts-same posts=8 median=900");
  assert.equal(sentences({ postCount: 0 }).length, 1);
});

test("follower, audience and top-post sentences appear when there is data", () => {
  const sentences = buildSummary(
    input({
      followers: { current: 5200, net: -40 },
      topCountry: { label: "Taiwan", share: 61.25 },
      topPost: {
        text: "  A long\n first line that keeps going past forty characters  ",
        multiplier: 3.04,
      },
    }),
    templates,
    "en-US",
  );
  assert.deepEqual(sentences.slice(2), [
    "followers-down net=40 total=5,200",
    "audience country=Taiwan share=61.3",
    // Whitespace collapses to one line, cut to 40 characters with an ellipsis.
    "top text=A long first line that keeps going past… multiplier=3.0",
  ]);
  const followers = (net) =>
    buildSummary(input({ followers: { current: 100, net } }), templates, "en-US")[2];
  assert.equal(followers(3), "followers-up net=3 total=100");
  assert.equal(followers(0), "followers-flat total=100");
});

test("a top post only earns a sentence when it clearly beat the median", () => {
  const withTop = (topPost) => buildSummary(input({ topPost }), templates, "en-US");
  assert.equal(withTop({ text: "Short post", multiplier: 1.49 }).length, 2);
  assert.equal(withTop({ text: "   ", multiplier: 4 }).length, 2);
  assert.equal(
    withTop({ text: "Short post", multiplier: 1.5 }).at(-1),
    "top text=Short post multiplier=1.5",
  );
});
