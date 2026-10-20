# Changelog

Notable changes to the Threads Analytics dashboard and macOS app, newest first. The website is not included.

## 0.1.2

### New

- See the replies you wrote today on Today, including ones under other accounts' posts, with each reply's views, likes and replies. Filter by others' posts or your own. ([#60](https://github.com/ridemountainpig/threads-analytics/pull/60))
- Overall performance today splits your account's views today into the estimated share from posts and the rest, with today's post count and average views per post. ([#60](https://github.com/ridemountainpig/threads-analytics/pull/60))
- Self-host with Docker Compose: one file runs the dashboard next to PostgreSQL and keeps your data in a volume. ([#61](https://github.com/ridemountainpig/threads-analytics/pull/61))

### Improved

- Received and sent replies share one Replies card, and tapping Awaiting reply opens the received ones. ([#60](https://github.com/ridemountainpig/threads-analytics/pull/60))

### Removed

- Zeabur is no longer a deploy option, since Zeabur is pausing its service. Deploy with Railway, Vercel or Docker Compose instead. ([#61](https://github.com/ridemountainpig/threads-analytics/pull/61))

## 0.1.1

### New

- Choose Light, Dark or Auto appearance from the sidebar or in Settings. Auto follows your system setting. ([#54](https://github.com/ridemountainpig/threads-analytics/pull/54))

### Improved

- Explore heat maps with the keyboard: arrow keys move between cells, and hover, focus or tap shows the details. ([#54](https://github.com/ridemountainpig/threads-analytics/pull/54))
- Chart options such as granularity stay the way you left them. ([#54](https://github.com/ridemountainpig/threads-analytics/pull/54))
- Pages no longer jump when they finish loading, and empty pages suggest a next step, such as widening the date range or syncing. ([#54](https://github.com/ridemountainpig/threads-analytics/pull/54))

### Maintenance

- Dependency updates. ([#45](https://github.com/ridemountainpig/threads-analytics/pull/45), [#53](https://github.com/ridemountainpig/threads-analytics/pull/53))
