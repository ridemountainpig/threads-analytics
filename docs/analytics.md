# Analytics Reference

[繁體中文](./analytics-zh.md) | English | [日本語](./analytics-ja.md)

Every chart and metric in the Threads Analytics dashboard, and the rules behind them.

> The time-series charts (Views Trend, Overall Performance, Engagement Rate Trend, Engagement Breakdown, Shares Over Time, Reach Growth Trend) each switch between **day / week / month** granularity, and each remembers its own choice.

## Overview

| Section         | What it shows                                                                                                                                                                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Summary**     | A few plain sentences generated from the period's numbers: how views and engagement rate moved, posting volume and typical reach, follower growth, where most followers are, the best hour, and the top post. Rule-based, so it never disagrees with the cards below.                      |
| **Stat Cards**  | Total views, likes, replies, reposts, quotes, shares, and engagement rate for the selected period. Each card shows a `+/−%` delta vs the previous period of the same length, plus a sparkline of the metric across the range (daily series are smoothed over 7 days).                      |
| **New Posts**   | Appears after you post: each post from the last 48 hours, its views at its latest reading against your typical post at the same age (as a multiple), with a small curve of both. The card stays hidden until the typical post can be drawn from at least 5 earlier posts read at that age. |
| **Best Hours**  | Top 2–3 posting hours ranked by median views, with a confidence indicator based on sample size.                                                                                                                                                                                            |
| **Views Trend** | Views by day, week, or month, with your personal median as a baseline.                                                                                                                                                                                                                     |
| **Top Posts**   | Posts that exceeded the median view count, ranked by their multiplier (e.g. `3.2× median`).                                                                                                                                                                                                |

## Analytics — Performance tab

Stats at the top of the tab: **Total Views**, **Avg Views / Day**, **Eng. Rate**, **Share Rate**.

| Chart                         | What it shows                                                                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Overall Performance**       | Combined daily views, post count, and average views per post on one timeline.                                                                           |
| **Post Quality Map**          | Scatter plot of every post by reach (views) vs. engagement rate. Dot size = shares. Four quadrants: Breakout, Conversation, Broadcast, Underperforming. |
| **Views to Actions Funnel**   | Conversion rate from total views into each action type (likes, replies, reposts, quotes, shares).                                                       |
| **Best Time to Post**         | An hourly bar chart of median views, with weekday filters, sample counts and confidence labels.                                                         |
| **Engagement Rate Trend**     | Engagement rate for the posts published each day, with a smoothed line over the last seven days that had posts.                                         |
| **Best Day of Week**          | Median views, engagement rate, and post count by weekday.                                                                                               |
| **Format × Length Matrix**    | 2-D heatmap comparing every combination of content format and post length against your median reach.                                                    |
| **Engagement Type Breakdown** | Pie chart of the proportion of likes, replies, reposts, quotes, and shares.                                                                             |
| **Engagement Breakdown**      | Stacked chart of likes, replies, reposts, and quotes over time.                                                                                         |
| **Reach Growth Trend**        | Median and average views per post over time — is the account's reach growing?                                                                           |
| **Views Distribution**        | How posts spread across view ranges, with hit rates for each milestone (1k, 5k, 10k…).                                                                  |

## Analytics — Content tab

Stat metrics at the top of the tab: **Posting Consistency** (% of weeks with at least one post), **Share Rate**, **Quote Ratio** (quotes ÷ (quotes + reposts)), **Total Posts**, **Longest Streak**, and **Current Streak**.

| Chart                                   | What it shows                                                                                                                    |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Posting Activity**                    | Calendar heatmap showing how many posts you published each day.                                                                  |
| **Content Type Performance**            | Median views, engagement rate, and share rate by media type (Text, Image, Video, Carousel, Audio). Low-sample buckets are faded. |
| **Post Length Analysis**                | Median views broken down by character-count bucket. Tooltip includes average, P75, hit rate, and confidence.                     |
| **Publishing Frequency vs Performance** | Whether posting more in a given week raises or lowers per-post average views.                                                    |
| **Shares Trend**                        | Daily share counts over time.                                                                                                    |
| **Top Keywords by Engagement**          | Words (excluding hashtags) with the highest average engagement rate (minimum 3 posts).                                           |
| **Optimal Posting Frequency**           | Per-post reach and engagement compared across different weekly posting volumes.                                                  |
| **Content Type by Time Slot**           | Best posting hour for each content format based on median views.                                                                 |
| **Top by Engagement Rate**              | Highest-engagement posts ranked by (likes + replies + reposts + quotes) ÷ views.                                                 |
| **Reply-Rate Leaders**                  | Posts ranked by replies ÷ views — your best conversation starters.                                                               |
| **Share-Rate Leaders**                  | Posts ranked by shares ÷ views — your most save-worthy content.                                                                  |
| **Posting Gap vs Performance**          | Median views by days since your previous post — does posting daily beat taking a break?                                          |
| **Content Feature Comparison**          | Posts with and without links, and with and without questions, compared side by side.                                             |

## Analytics — Audience tab

Stats at the top of the tab: **Followers**, **Net Growth** (with `+/−%`), **Avg / Day**, **Days Tracked**.

| Chart                     | What it shows                                                                                                                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Follower Growth**       | Two views: **Overall** (follower count line) and **Daily Change** (signed bars, with the biggest outlier days labelled). Days you posted are marked along the bottom, and the tooltip lists those posts so a jump can be traced to what went out. |
| **Follower Demographics** | One distribution per breakdown — country, city, age, gender — with a marker on each bar for the baseline date and both a head-count and a percentage-point delta.                                                                                 |
| **Composition Trend**     | Each group's share as a change in percentage points from the baseline date, top 5 movers per breakdown. Composition shifts too slowly for absolute shares to show anything.                                                                       |

> Threads only reports follower counts and demographics as of right now, so history starts from your first sync and missed days can’t be filled in later. The follower count refreshes on every sync. Demographics are fetched once a day; if a fetch fails, the next sync at least six hours later retries it. Demographics require at least 100 followers. The date selectors only list days that have data.

> Post metrics are running totals updated on each sync. The dashboard doesn’t keep snapshots at fixed points like 24 or 48 hours after posting, so comparing posts at the same age means recording those numbers yourself.

## Posts page

The posts list supports:

- **Sort** by date, views, or likes
- **Search** full-text across post content
- **Filter** by media type (shows only types present in the current period)

Clicking any post opens a detail panel with views, engagement rate, vs-median multiplier, view percentile, and a per-action engagement breakdown.

### Growth

The detail panel's **Growth** section charts how the post's views built up over its first 7 days against your typical post (dashed), and lists its views 1h, 3h, 6h, 12h, 24h, 48h and 7d after publishing, each with the multiple of the typical post at that age. This compares a post from yesterday and one from last month on equal terms, where the vs-median figures above favor older posts.

- Readings are recorded by each sync during a post's first 30 days: at most every 15 minutes in the first six hours, hourly to two days, every six hours to a week, then daily. Recording starts with the version that added it, so earlier posts show no growth.
- Values between two readings are interpolated; an age whose readings are too far apart to estimate shows `—`. Hourly syncs cover every milestone.
- The **typical post** is the median of your 60 most recent posts with growth data, whatever period is selected, so the Growth section and the overview's New Posts card always agree. It is shown once at least 5 of those posts were read at an age.

### Threads (multi-part posts)

Posts you continue in your own replies (the "2/", "3/" parts) are synced alongside the root post. Only replies that chain from your own root post count as parts; replies to commenters and replies under other accounts' posts are ignored. Parts are stored separately and never counted as posts anywhere else in the dashboard.

- Multi-part posts show an **N-part thread** badge in the list and detail header.
- The detail panel shows **Part 2 Retention**: views of part 2 as a share of part 1, i.e. how much of the audience read on.
- A **Thread** section lists every part with its views (as a bar relative to part 1), likes, replies, and how long after the previous part it was posted.
- **Part 2 Type** compares retention by what part 2 is made of: link only, link + note, or text only. Each chip shows that type's median retention across the period and how many threads it's based on; a type with fewer than 5 threads shows no median.
- The CSV export includes `thread_parts` and `part2_retention_pct` columns.

Fetching parts needs a token with the `threads_read_replies` permission; without it, posts still sync and thread parts are skipped.

---

[← Back to README](../README.md)
