"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Eye, Heart, MessageCircle, type LucideIcon } from "lucide-react";
import type { PostInsights } from "@/lib/threads-api";
import type { MyReply } from "@/lib/today-replies";
import { normalizeIntlSpaces } from "@/lib/utils";
import ExpandableText from "./expandable-text";
import { excerpt, filterChipClass, RetryButton } from "./reply-inbox";

type Filter = "all" | "others" | "own";

export interface MyRepliesLabels {
  myRepliesTitle: string;
  filterAll: string;
  filterOthers: string;
  filterOwn: string;
  onPost: string;
  onOthersPost: string;
  noMyReplies: string;
  noMyRepliesFilter: string;
  myRepliesTruncated: string;
  myRepliesViews: string;
  views: string;
  likes: string;
  replies: string;
  viewOnThreads: string;
  noText: string;
  showMore: string;
  showLess: string;
  tryAgain: string;
}

export type MyRepliesProps =
  | {
      status: "ok";
      replies: Array<MyReply & { postText: string | null; insights: PostInsights | null }>;
      truncated: boolean;
      labels: MyRepliesLabels;
      locale: string;
      timeZone: string;
    }
  | { status: "unavailable"; retry: boolean; message: string; labels: MyRepliesLabels };

export default function MyReplies(props: MyRepliesProps) {
  if (props.status === "ok") return <ReplyList {...props} />;
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-sm">{props.message}</p>
      {props.retry && <RetryButton label={props.labels.tryAgain} />}
    </div>
  );
}

function ReplyList({
  replies,
  truncated,
  labels,
  locale,
  timeZone,
}: Extract<MyRepliesProps, { status: "ok" }>) {
  const [filter, setFilter] = useState<Filter>("all");
  const timeFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { timeZone, hour: "2-digit", minute: "2-digit" }),
    [locale, timeZone],
  );
  const others = replies.filter((reply) => reply.ownPostId === null);
  const own = replies.filter((reply) => reply.ownPostId !== null);
  const filters: Array<{ value: Filter; label: string }> = [
    { value: "all", label: `${labels.filterAll} ${replies.length}` },
    { value: "others", label: `${labels.filterOthers} ${others.length}` },
    { value: "own", label: `${labels.filterOwn} ${own.length}` },
  ];
  const shown = filter === "others" ? others : filter === "own" ? own : replies;
  const measured = shown.filter((reply) => reply.insights);
  const shownViews =
    measured.length > 0
      ? measured.reduce((sum, reply) => sum + (reply.insights?.views ?? 0), 0)
      : null;

  return (
    <div>
      {replies.length > 0 && (
        <div role="group" aria-label={labels.myRepliesTitle} className="mb-2 flex flex-wrap gap-2">
          {filters.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={filterChipClass(filter === value)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {shown.length > 0 ? (
        <ul>
          {shown.map((reply) => (
            <li key={reply.id} className="border-b py-3 last:border-0">
              <ExpandableText
                text={reply.text || labels.noText}
                className="text-sm"
                labels={{ more: labels.showMore, less: labels.showLess }}
              />
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="text-muted-foreground min-w-0 truncate text-xs">
                  <span className="tabular-nums">
                    {normalizeIntlSpaces(timeFormat.format(new Date(reply.timestamp)))}
                  </span>
                  {" · "}
                  {reply.postText === null
                    ? labels.onOthersPost
                    : labels.onPost.replace("{text}", excerpt(reply.postText) || labels.noText)}
                </p>
                <div className="flex shrink-0 items-center gap-2.5">
                  {reply.insights && (
                    <p className="text-muted-foreground flex items-center gap-2.5 text-xs tabular-nums">
                      <Metric
                        icon={Eye}
                        value={reply.insights.views}
                        label={labels.views}
                        locale={locale}
                      />
                      <Metric
                        icon={Heart}
                        value={reply.insights.likes}
                        label={labels.likes}
                        locale={locale}
                      />
                      {reply.insights.replies > 0 && (
                        <Metric
                          icon={MessageCircle}
                          value={reply.insights.replies}
                          label={labels.replies}
                          locale={locale}
                        />
                      )}
                    </p>
                  )}
                  {reply.permalink && (
                    <a
                      href={reply.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={labels.viewOnThreads}
                      title={labels.viewOnThreads}
                      className="text-tint -m-3.5 shrink-0 p-3.5 transition-opacity duration-150 hover:opacity-80 active:opacity-60 motion-reduce:transition-none"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground py-2 text-sm">
          {replies.length === 0 ? labels.noMyReplies : labels.noMyRepliesFilter}
        </p>
      )}

      {(shownViews !== null || truncated) && (
        <div className="text-muted-foreground space-y-1 border-t pt-3 text-xs tabular-nums">
          {shownViews !== null && (
            <p>{labels.myRepliesViews.replace("{count}", shownViews.toLocaleString(locale))}</p>
          )}
          {truncated && (
            <p>
              {labels.myRepliesTruncated.replace("{count}", replies.length.toLocaleString(locale))}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({
  icon: Icon,
  value,
  label,
  locale,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  locale: string;
}) {
  return (
    <span className="inline-flex items-center gap-1" title={label}>
      <Icon aria-hidden className="size-3" />
      {value.toLocaleString(locale)}
      <span className="sr-only">{label}</span>
    </span>
  );
}
