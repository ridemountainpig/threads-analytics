import { chartColors } from "./chart-style";

interface TextFeatureStats {
  postCount: number;
  medianViews: number;
  engagementRate: number;
  replyRate: number;
  shareRate: number;
}

interface TextFeatureComparisonProps {
  data: Array<{
    feature: "link" | "question";
    withFeature: TextFeatureStats;
    withoutFeature: TextFeatureStats;
  }>;
  numberLocale?: string;
  labels?: {
    withLink: string;
    withoutLink: string;
    withQuestion: string;
    withoutQuestion: string;
    medianViews: string;
    engagementRate: string;
    replyRate: string;
    posts: string;
    noData: string;
  };
}

export default function TextFeatureComparison({
  data,
  numberLocale,
  labels,
}: TextFeatureComparisonProps) {
  const locale = numberLocale ?? "en-US";
  const copy = labels ?? {
    withLink: "With link",
    withoutLink: "No link",
    withQuestion: "With question",
    withoutQuestion: "No question",
    medianViews: "Median Views",
    engagementRate: "Engagement Rate",
    replyRate: "Reply Rate",
    posts: "Posts",
    noData: "No data",
  };

  const rowsFor = (point: TextFeatureComparisonProps["data"][number]) => {
    const names =
      point.feature === "link"
        ? [copy.withLink, copy.withoutLink]
        : [copy.withQuestion, copy.withoutQuestion];
    return [
      { name: names[0], stats: point.withFeature, highlight: true },
      { name: names[1], stats: point.withoutFeature, highlight: false },
    ];
  };

  const hasData = data.some(
    (point) => point.withFeature.postCount > 0 || point.withoutFeature.postCount > 0,
  );
  if (!hasData) {
    return (
      <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
        {copy.noData}
      </div>
    );
  }

  return (
    <div className="space-y-10 py-2">
      {data.map((point) => {
        const rows = rowsFor(point);
        const maxMedian = Math.max(1, ...rows.map((row) => row.stats.medianViews));
        return (
          <div key={point.feature} className="space-y-6">
            {rows.map((row) => (
              <div key={row.name} className="grid grid-cols-[6.5rem_1fr] items-center gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{row.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {row.stats.postCount.toLocaleString(locale)} {copy.posts}
                  </p>
                </div>
                <div className="min-w-0">
                  <div className="bg-muted h-4 overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round((row.stats.medianViews / maxMedian) * 100)}%`,
                        backgroundColor: row.highlight ? chartColors.views : chartColors.volume,
                      }}
                    />
                  </div>
                  <p className="text-muted-foreground mt-1.5 text-xs tabular-nums">
                    {copy.medianViews} {row.stats.medianViews.toLocaleString(locale)} ·{" "}
                    {copy.engagementRate} {row.stats.engagementRate.toFixed(2)}% · {copy.replyRate}{" "}
                    {row.stats.replyRate.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
