"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InboxReply } from "@/lib/today-replies";
import { cn, normalizeIntlSpaces } from "@/lib/utils";

type Filter = "awaiting" | "all" | "answered";

export interface ReplyInboxLabels {
  repliesTitle: string;
  repliesSub: string;
  filterAwaiting: string;
  filterAll: string;
  filterAnswered: string;
  privateProfile: string;
  onPost: string;
  viewOnThreads: string;
  authorReplies: string;
  replyRate: string;
  noReplies: string;
  noAwaiting: string;
  noAnswered: string;
  repliesPartial: string;
  noText: string;
}

export type ReplyInboxProps =
  | {
      status: "ok";
      replies: Array<InboxReply & { postText: string }>;
      awaiting: number;
      answered: number;
      authorReplies: number;
      replyRate: number | null;
      failedPosts: number;
      labels: ReplyInboxLabels;
      locale: string;
      timeZone: string;
    }
  | { status: "unavailable"; message: string; labels: ReplyInboxLabels };

function excerpt(text: string, max = 24) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}

export default function ReplyInbox(props: ReplyInboxProps) {
  const { labels } = props;
  const header = (
    <CardHeader>
      <CardTitle className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
        {labels.repliesTitle}
      </CardTitle>
      <p className="text-muted-foreground text-xs">{labels.repliesSub}</p>
    </CardHeader>
  );

  if (props.status === "unavailable") {
    return (
      <Card>
        {header}
        <CardContent>
          <p className="text-muted-foreground text-sm">{props.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {header}
      <CardContent>
        <InboxList {...props} />
      </CardContent>
    </Card>
  );
}

function InboxList({
  replies,
  awaiting,
  answered,
  authorReplies,
  replyRate,
  failedPosts,
  labels,
  locale,
  timeZone,
}: Extract<ReplyInboxProps, { status: "ok" }>) {
  const [filter, setFilter] = useState<Filter>(awaiting > 0 ? "awaiting" : "all");
  const timeFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { timeZone, hour: "2-digit", minute: "2-digit" }),
    [locale, timeZone],
  );
  const filters: Array<{ value: Filter; label: string }> = [
    { value: "awaiting", label: `${labels.filterAwaiting} ${awaiting}` },
    { value: "all", label: `${labels.filterAll} ${replies.length}` },
    { value: "answered", label: `${labels.filterAnswered} ${answered}` },
  ];
  const shown = filter === "all" ? replies : replies.filter((reply) => reply.status === filter);
  const empty =
    replies.length === 0
      ? labels.noReplies
      : filter === "awaiting"
        ? labels.noAwaiting
        : labels.noAnswered;
  const summary = [
    authorReplies > 0 &&
      labels.authorReplies.replace("{count}", authorReplies.toLocaleString(locale)),
    replyRate !== null && labels.replyRate.replace("{rate}", String(replyRate)),
  ].filter(Boolean);

  return (
    <div>
      {replies.length > 0 && (
        <div role="group" aria-label={labels.repliesTitle} className="mb-2 flex flex-wrap gap-2">
          {filters.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={cn(
                // The ::after strip stretches the 32px chip to a 44px tap target.
                "relative inline-flex h-8 items-center rounded-full px-3 text-xs whitespace-nowrap tabular-nums transition-[background-color,color,transform] duration-150 after:absolute after:inset-x-0 after:-inset-y-1.5 active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100",
                filter === value
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-muted/70 text-foreground/70 hover:text-foreground",
              )}
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
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
                  {filter === "all" && reply.status === "awaiting" && (
                    <span aria-hidden className="bg-foreground/60 size-1.5 shrink-0 rounded-full" />
                  )}
                  <span className="truncate">
                    {reply.username ? `@${reply.username}` : labels.privateProfile}
                  </span>
                </span>
                <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                  {normalizeIntlSpaces(timeFormat.format(new Date(reply.timestamp)))}
                </span>
              </div>
              <p className="mt-0.5 line-clamp-4 text-sm break-words whitespace-pre-line">
                {reply.text}
              </p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="text-muted-foreground min-w-0 truncate text-xs">
                  {labels.onPost.replace("{text}", excerpt(reply.postText) || labels.noText)}
                </p>
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
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground py-2 text-sm">{empty}</p>
      )}

      {(summary.length > 0 || failedPosts > 0) && (
        <div
          className={cn(
            "text-muted-foreground space-y-1 pt-3 text-xs",
            shown.length > 0 && "border-t",
          )}
        >
          {summary.length > 0 && <p className="tabular-nums">{summary.join(" · ")}</p>}
          {failedPosts > 0 && (
            <p className="text-amber-700 dark:text-amber-400">
              {labels.repliesPartial.replace("{count}", String(failedPosts))}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
