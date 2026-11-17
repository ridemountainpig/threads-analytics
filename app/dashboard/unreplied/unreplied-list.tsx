"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ExternalLink, MessageCircle, RotateCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SegmentedControl } from "@/components/charts/segmented-control";
import { refreshUnrepliedAction } from "@/actions/unreplied";
import { sortUnreplied, type UnrepliedComment, type UnrepliedSort } from "@/lib/today-replies";
import { cn, normalizeIntlSpaces } from "@/lib/utils";
import ExpandableText from "../today/expandable-text";
import { excerpt } from "../today/reply-inbox";

export interface UnrepliedListLabels {
  listTitle: string;
  listSub: string;
  sortLabel: string;
  sortNewest: string;
  sortOldest: string;
  sortDiscussed: string;
  threadReplies: string;
  threadRepliesOne: string;
  replyOnThreads: string;
  viewPost: string;
  onPost: string;
  privateProfile: string;
  noText: string;
  showMore: string;
  showLess: string;
  refresh: string;
  refreshing: string;
  likesNote: string;
  openSettings: string;
  tryAgain: string;
}

export type UnrepliedItem = UnrepliedComment & {
  postText: string;
  postPermalink: string;
  waited: string;
};

export type UnrepliedListProps =
  | {
      status: "ok";
      comments: UnrepliedItem[];
      emptyMessage: string;
      notices: string[];
      labels: UnrepliedListLabels;
      locale: string;
      timeZone: string;
    }
  | {
      status: "unavailable";
      reason: "missing_permission" | "token_expired" | "failed";
      message: string;
      labels: UnrepliedListLabels;
    };

const titleClass = "text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase";

function RefreshButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          await refreshUnrepliedAction();
          router.refresh();
        })
      }
      disabled={pending}
      className="bg-tint/12 text-tint hover:bg-tint/18 relative inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-[background-color,color,scale] duration-150 after:absolute after:inset-x-0 after:-inset-y-2 active:scale-[0.96] disabled:opacity-60 disabled:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100"
    >
      <RotateCw
        aria-hidden
        className={cn("size-3.5", pending && "animate-spin motion-reduce:animate-none")}
      />
      {pending ? pendingLabel : label}
    </button>
  );
}

export default function UnrepliedList(props: UnrepliedListProps) {
  const { labels } = props;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className={titleClass}>{labels.listTitle}</CardTitle>
          <RefreshButton label={labels.refresh} pendingLabel={labels.refreshing} />
        </div>
        <p className="text-muted-foreground text-xs">{labels.listSub}</p>
      </CardHeader>
      <CardContent>
        {props.status === "ok" ? (
          <CommentList {...props} />
        ) : (
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">{props.message}</p>
            {props.reason !== "failed" && (
              <Link
                href="/dashboard/settings"
                className="text-tint -my-2.5 inline-flex min-h-11 items-center gap-1 text-sm font-medium transition-opacity duration-150 hover:opacity-80 active:opacity-60 motion-reduce:transition-none"
              >
                {labels.openSettings}
                <ArrowRight aria-hidden className="size-3.5" />
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CommentList({
  comments,
  emptyMessage,
  notices,
  labels,
  locale,
  timeZone,
}: Extract<UnrepliedListProps, { status: "ok" }>) {
  const [sort, setSort] = useState<UnrepliedSort>("newest");
  const shown = useMemo(() => sortUnreplied(comments, sort), [comments, sort]);
  const dateFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        timeZone,
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [locale, timeZone],
  );

  return (
    <div>
      {comments.length > 1 && (
        <SegmentedControl
          value={sort}
          onChange={setSort}
          label={labels.sortLabel}
          className="mb-2"
          options={[
            { value: "newest", label: labels.sortNewest },
            { value: "oldest", label: labels.sortOldest },
            { value: "discussed", label: labels.sortDiscussed },
          ]}
        />
      )}

      {shown.length > 0 ? (
        <ul>
          {shown.map((comment) => (
            <li key={comment.id} className="border-b py-3 last:border-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-sm font-medium">
                  {comment.username ? `@${comment.username}` : labels.privateProfile}
                </span>
                <span
                  className="text-muted-foreground shrink-0 text-xs tabular-nums"
                  title={normalizeIntlSpaces(dateFormat.format(new Date(comment.timestamp)))}
                >
                  {comment.waited}
                </span>
              </div>
              <ExpandableText
                text={comment.text}
                className="mt-0.5 text-sm"
                labels={{ more: labels.showMore, less: labels.showLess }}
              />
              <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                {comment.postPermalink ? (
                  <a
                    href={comment.postPermalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={labels.viewPost}
                    className="hover:text-foreground min-w-0 truncate transition-colors duration-150"
                  >
                    {labels.onPost.replace("{text}", excerpt(comment.postText) || labels.noText)}
                  </a>
                ) : (
                  <span className="min-w-0 truncate">
                    {labels.onPost.replace("{text}", excerpt(comment.postText) || labels.noText)}
                  </span>
                )}
                {comment.threadReplies > 0 && (
                  <span className="inline-flex shrink-0 items-center gap-1 tabular-nums">
                    <MessageCircle aria-hidden className="size-3" />
                    {comment.threadReplies === 1
                      ? labels.threadRepliesOne
                      : labels.threadReplies.replace(
                          "{count}",
                          comment.threadReplies.toLocaleString(locale),
                        )}
                  </span>
                )}
                {comment.permalink && (
                  <a
                    href={comment.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-tint ml-auto inline-flex min-h-8 shrink-0 items-center gap-1 font-medium transition-opacity duration-150 hover:opacity-80 active:opacity-60 motion-reduce:transition-none"
                  >
                    {labels.replyOnThreads}
                    <ExternalLink aria-hidden className="size-3.5" />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground py-2 text-sm">{emptyMessage}</p>
      )}

      <div
        className={cn(
          "text-muted-foreground space-y-1 pt-3 text-xs",
          shown.length > 0 && "border-t",
        )}
      >
        {notices.map((notice) => (
          <p key={notice} className="text-amber-700 dark:text-amber-400">
            {notice}
          </p>
        ))}
        <p>{labels.likesNote}</p>
      </div>
    </div>
  );
}
