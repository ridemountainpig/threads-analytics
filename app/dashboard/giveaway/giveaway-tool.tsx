"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Copy, ExternalLink, Loader2, Search, Ticket, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchGiveawayRepliesAction } from "@/actions/giveaway";
import type { ThreadsReply } from "@/lib/threads-api";
import type { Dictionary } from "@/lib/i18n";

interface GiveawayPost {
  id: string;
  text: string;
  timestamp: string;
  replies: number;
  permalink: string;
}

interface Prize {
  id: number;
  name: string;
  count: number;
}

interface PrizeResult {
  prizeName: string;
  winners: ThreadsReply[];
}

interface GiveawayToolProps {
  posts: GiveawayPost[];
  labels: Dictionary["giveaway"];
  dateLocale: string;
  timeZone: string;
}

const MENTION_RE = /@[a-z0-9._]+/gi;
const ENTRY_DISPLAY_LIMIT = 200;

// datetime-local has no zone; read it in the dashboard's display zone so the
// cutoff matches the timestamps shown next to each reply.
function zonedDateTimeToUtc(local: string, timeZone: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(local);
  if (!m) return null;
  const n = (i: number) => Number(m[i] ?? 0);
  const asUtc = Date.UTC(n(1), n(2) - 1, n(3), n(4), n(5), n(6));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(asUtc));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const zoned = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return new Date(asUtc - (zoned - asUtc));
}

function secureShuffle<T>(items: T[]): T[] {
  const arr = [...items];
  const rand = new Uint32Array(arr.length);
  crypto.getRandomValues(rand);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (rand[i] as number) % (i + 1);
    [arr[i], arr[j]] = [arr[j] as T, arr[i] as T];
  }
  return arr;
}

function ExcludeUserPicker({
  usernames,
  selected,
  onAdd,
  onRemove,
  disabled,
  placeholder,
  loadFirstLabel,
}: {
  usernames: string[];
  selected: string[];
  onAdd: (username: string) => void;
  onRemove: (username: string) => void;
  disabled: boolean;
  placeholder: string;
  loadFirstLabel: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const q = query.trim().replace(/^@/, "").toLowerCase();
  const selectedSet = new Set(selected.map((u) => u.toLowerCase()));
  const matches = usernames
    .filter((u) => !selectedSet.has(u.toLowerCase()) && (!q || u.toLowerCase().includes(q)))
    .slice(0, 30);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-idx="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function add(username: string) {
    onAdd(username);
    setQuery("");
    setActiveIndex(0);
  }

  return (
    <div
      ref={wrapRef}
      className="min-w-0 flex-1 basis-40"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="h-7 w-full text-xs"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && matches.length > 0 ? `${listboxId}-${activeIndex}` : undefined
          }
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              if (!open) setOpen(true);
              else setActiveIndex((i) => Math.min(i + 1, matches.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
              const pick = matches[activeIndex] ?? matches[0];
              if (pick) add(pick);
              else if (q) add(query.trim().replace(/^@/, ""));
            } else if (e.key === "Escape") {
              setOpen(false);
            } else if (e.key === "Backspace" && !query && selected.length > 0) {
              onRemove(selected[selected.length - 1] as string);
            }
          }}
        />
        {open && !disabled && (matches.length > 0 || usernames.length === 0) && (
          <div className="bg-popover animate-in fade-in-0 zoom-in-95 absolute top-full left-0 z-10 mt-1 w-full origin-top overflow-hidden rounded-md border shadow-md duration-100 motion-reduce:animate-none">
            {usernames.length === 0 ? (
              <p className="text-muted-foreground px-2.5 py-2 text-xs">{loadFirstLabel}</p>
            ) : (
              <ul
                ref={listRef}
                id={listboxId}
                role="listbox"
                className="scrollbar-subtle max-h-44 overflow-y-auto py-1"
              >
                {matches.map((u, i) => (
                  <li
                    key={u}
                    id={`${listboxId}-${i}`}
                    role="option"
                    aria-selected={i === activeIndex}
                  >
                    <button
                      type="button"
                      data-idx={i}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => add(u)}
                      className={cn(
                        "w-full truncate px-2.5 py-1.5 text-left text-xs",
                        i === activeIndex && "bg-accent",
                      )}
                    >
                      @{u}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ConditionRow({
  checked,
  onChange,
  label,
  children,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  children?: React.ReactNode;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  function handleChange(next: boolean) {
    onChange(next);
    // Focus lands after React re-enables the input on the next paint.
    if (next)
      requestAnimationFrame(() =>
        rowRef.current?.querySelector<HTMLInputElement>('input:not([type="checkbox"])')?.focus(),
      );
  }
  return (
    <div ref={rowRef} className="flex min-h-8 flex-wrap items-center gap-2.5">
      <label className="flex cursor-pointer items-center gap-2.5 text-sm select-none">
        <Switch checked={checked} onCheckedChange={handleChange} />
        {label}
      </label>
      {children}
    </div>
  );
}

export default function GiveawayTool({ posts, labels, dateLocale, timeZone }: GiveawayToolProps) {
  const [postId, setPostId] = useState<string>("");
  const [replies, setReplies] = useState<ThreadsReply[] | null>(null);
  const [loadedPost, setLoadedPost] = useState<GiveawayPost | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(false);

  const [excludeOn, setExcludeOn] = useState(false);
  const [excludedUsers, setExcludedUsers] = useState<string[]>([]);
  const [dedupeOn, setDedupeOn] = useState(true);
  const [textOn, setTextOn] = useState(false);
  const [keywordOn, setKeywordOn] = useState(false);
  const [keywordText, setKeywordText] = useState("");
  const [mentionsOn, setMentionsOn] = useState(false);
  const [mentionsCount, setMentionsCount] = useState("1");
  const [beforeOn, setBeforeOn] = useState(false);
  const [beforeText, setBeforeText] = useState("");

  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [prizeName, setPrizeName] = useState("");
  const [prizeCount, setPrizeCount] = useState("1");
  const [nextPrizeId, setNextPrizeId] = useState(1);

  const [entrySearch, setEntrySearch] = useState("");
  const entrySearchRef = useRef<HTMLInputElement>(null);

  const [results, setResults] = useState<PrizeResult[] | null>(null);
  const [redrawConfirmOpen, setRedrawConfirmOpen] = useState(false);
  const [drawnAt, setDrawnAt] = useState<Date | null>(null);
  const [drawShortfall, setDrawShortfall] = useState<number | null>(null);
  const [drawStats, setDrawStats] = useState<{ pool: number; won: number } | null>(null);

  const dateTimeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(dateLocale, {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone,
      }),
    [dateLocale, timeZone],
  );
  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(dateLocale, { dateStyle: "medium", timeZone }),
    [dateLocale, timeZone],
  );

  const selectedPost = posts.find((p) => p.id === postId);

  const replyUsernames = useMemo(() => {
    if (!replies) return [];
    const seen = new Map<string, string>();
    for (const r of replies) {
      const key = r.username.toLowerCase();
      if (!seen.has(key)) seen.set(key, r.username);
    }
    return [...seen.values()].sort((a, b) => a.localeCompare(b));
  }, [replies]);

  const eligible = useMemo(() => {
    if (!replies) return [];
    let list = [...replies].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    if (excludeOn && excludedUsers.length > 0) {
      const excluded = new Set(excludedUsers.map((u) => u.toLowerCase()));
      list = list.filter((r) => !excluded.has(r.username.toLowerCase()));
    }

    if (textOn) {
      list = list.filter((r) => r.text.trim().length > 0);
    }

    if (keywordOn) {
      const keywords = keywordText
        .split(/[,，]/)
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);
      if (keywords.length > 0) {
        list = list.filter((r) => {
          const text = r.text.toLowerCase();
          return keywords.some((k) => text.includes(k));
        });
      }
    }

    if (mentionsOn) {
      const min = Math.max(1, Number.parseInt(mentionsCount, 10) || 1);
      list = list.filter((r) => (r.text.match(MENTION_RE) ?? []).length >= min);
    }

    if (beforeOn && beforeText) {
      const cutoff = zonedDateTimeToUtc(beforeText, timeZone);
      if (cutoff) list = list.filter((r) => new Date(r.timestamp) <= cutoff);
    }

    if (dedupeOn) {
      const seen = new Set<string>();
      list = list.filter((r) => {
        const key = r.username.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    return list;
  }, [
    replies,
    excludeOn,
    excludedUsers,
    dedupeOn,
    textOn,
    keywordOn,
    keywordText,
    mentionsOn,
    mentionsCount,
    beforeOn,
    beforeText,
    timeZone,
  ]);

  const entrySearchQ = entrySearch.trim().replace(/^@/, "").toLowerCase();
  const visibleEntries = entrySearchQ
    ? eligible.filter(
        (r) =>
          r.username.toLowerCase().includes(entrySearchQ) ||
          r.text.toLowerCase().includes(entrySearchQ),
      )
    : eligible;

  const totalPrizeCount = prizes.reduce((sum, p) => sum + p.count, 0);

  async function loadReplies() {
    if (!postId || loading) return;
    setLoading(true);
    try {
      const res = await fetchGiveawayRepliesAction(postId);
      if (res.error) {
        if (res.error === "missing_permission") toast.error(labels.errMissingPermission);
        else if (res.error === "token_expired") toast.error(labels.errTokenExpired);
        else toast.error(labels.errLoadFailed);
        return;
      }
      const loaded = res.replies ?? [];
      setReplies(loaded);
      setLoadedPost(posts.find((p) => p.id === postId) ?? null);
      setTruncated(res.truncated ?? false);
      setResults(null);
      setDrawnAt(null);
      setDrawShortfall(null);
      setDrawStats(null);
      setEntrySearch("");
      if (loaded.length === 0) toast.info(labels.errNoReplies);
    } finally {
      setLoading(false);
    }
  }

  function addPrize() {
    const name = prizeName.trim();
    const count = Math.max(1, Number.parseInt(prizeCount, 10) || 1);
    if (!name) return;
    setPrizes((prev) => [...prev, { id: nextPrizeId, name, count }]);
    setNextPrizeId((id) => id + 1);
    setPrizeName("");
    setPrizeCount("1");
  }

  const resultsRef = useRef<HTMLDivElement>(null);

  function draw() {
    const pool = secureShuffle(eligible);
    const drawn: PrizeResult[] = prizes.map((p) => ({ prizeName: p.name, winners: [] }));
    const counts = prizes.map((p) => p.count);
    const won = new Set<string>();
    let slot = 0;
    for (const entry of pool) {
      while (
        slot < drawn.length &&
        (drawn[slot] as PrizeResult).winners.length >= (counts[slot] as number)
      ) {
        slot++;
      }
      if (slot >= drawn.length) break;
      const key = entry.username.toLowerCase();
      if (won.has(key)) continue;
      won.add(key);
      (drawn[slot] as PrizeResult).winners.push(entry);
    }
    setResults(drawn);
    setDrawnAt(new Date());
    setDrawShortfall(won.size < totalPrizeCount ? won.size : null);
    setDrawStats({ pool: eligible.length, won: won.size });
    // Below lg the results card sits offscreen under the setup card.
    if (!window.matchMedia("(min-width: 64rem)").matches) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      requestAnimationFrame(() =>
        resultsRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" }),
      );
    }
  }

  async function copyResults() {
    if (!results) return;
    const text = results
      .map(
        (r) =>
          `🎁 ${r.prizeName} × ${r.winners.length}\n` +
          r.winners.map((w, i) => `${i + 1}. @${w.username}`).join("\n"),
      )
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success(labels.copied);
    } catch {
      toast.error(labels.copyFailed);
    }
  }

  const canDraw = Boolean(replies && eligible.length > 0 && prizes.length > 0);
  const uniqueAccounts = replies ? new Set(replies.map((r) => r.username.toLowerCase())).size : 0;

  const revealOffsets: number[] = [];
  if (results) {
    let acc = 0;
    for (const r of results) {
      revealOffsets.push(acc);
      acc += r.winners.length;
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card className="min-w-0 lg:col-span-2 lg:self-start">
        <CardHeader className="border-b">
          <CardTitle>{labels.selectPost}</CardTitle>
          <CardAction>
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
                eligible.length > 0 ? "bg-tint/10 text-tint" : "bg-muted text-muted-foreground",
              )}
              title={labels.eligibleEntries}
            >
              <Ticket className="size-3.5" />
              {eligible.length}
              <span className="sr-only">{labels.eligibleEntries}</span>
            </span>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select value={postId} onValueChange={(v) => setPostId(String(v ?? ""))}>
                <SelectTrigger
                  className="w-full min-w-0 flex-1 overflow-hidden"
                  aria-label={labels.selectPost}
                >
                  <SelectValue className="min-w-0">
                    {() =>
                      selectedPost ? (
                        <span className="truncate">
                          {selectedPost.text.trim() ? selectedPost.text : selectedPost.id} (
                          {dateFmt.format(new Date(selectedPost.timestamp))})
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {labels.selectPostPlaceholder}
                        </span>
                      )
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent
                  align="start"
                  alignItemWithTrigger={false}
                  className="scrollbar-subtle max-h-72"
                >
                  {posts.map((p) => (
                    <SelectItem key={p.id} value={p.id} label={p.text.trim() ? p.text : p.id}>
                      <span className="flex min-w-0 flex-1 items-baseline gap-2">
                        <span className="max-w-72 truncate">{p.text.trim() ? p.text : p.id}</span>
                        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                          {dateFmt.format(new Date(p.timestamp))} ·{" "}
                          {labels.repliesShort.replace("{count}", String(p.replies))}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={loadReplies}
                disabled={!postId || loading}
                variant="secondary"
                className="w-full sm:w-auto"
              >
                {loading && <Loader2 className="size-3.5 animate-spin" />}
                {loading ? labels.loadingReplies : replies ? labels.reload : labels.loadReplies}
              </Button>
            </div>
            {replies && (
              <p className="text-muted-foreground text-xs">
                {labels.loadedReplies
                  .replace("{count}", String(replies.length))
                  .replace(
                    "{users}",
                    String(new Set(replies.map((r) => r.username.toLowerCase())).size),
                  )}
                {truncated && ` ${labels.truncatedNote.replace("{count}", String(replies.length))}`}
              </p>
            )}
          </div>

          <div className="space-y-2.5">
            <h3 className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
              {labels.conditions}
            </h3>
            <ConditionRow
              checked={excludeOn}
              onChange={setExcludeOn}
              label={labels.excludeAccounts}
            >
              <ExcludeUserPicker
                usernames={replyUsernames}
                selected={excludedUsers}
                onAdd={(u) =>
                  setExcludedUsers((prev) =>
                    prev.some((x) => x.toLowerCase() === u.toLowerCase()) ? prev : [...prev, u],
                  )
                }
                onRemove={(u) => setExcludedUsers((prev) => prev.filter((x) => x !== u))}
                disabled={!excludeOn}
                placeholder={labels.excludeAccountsPlaceholder}
                loadFirstLabel={labels.excludeAccountsLoadFirst}
              />
            </ConditionRow>
            {excludedUsers.length > 0 && (
              <div
                className={cn(
                  "flex flex-wrap items-center gap-1.5 transition-opacity duration-200 motion-reduce:transition-none",
                  !excludeOn && "opacity-50",
                )}
              >
                {excludedUsers.map((u) => (
                  <span
                    key={u}
                    className="bg-muted flex items-center gap-0.5 rounded-full py-0.5 pr-0.5 pl-2 text-xs"
                  >
                    @{u}
                    <button
                      type="button"
                      onClick={() => setExcludedUsers((prev) => prev.filter((x) => x !== u))}
                      disabled={!excludeOn}
                      aria-label={`@${u} ×`}
                      className="text-muted-foreground hover:text-foreground hover:bg-foreground/10 -my-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full disabled:pointer-events-none"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <ConditionRow
              checked={dedupeOn}
              onChange={setDedupeOn}
              label={labels.excludeDuplicates}
            />
            <ConditionRow checked={textOn} onChange={setTextOn} label={labels.requireText} />
            <ConditionRow checked={keywordOn} onChange={setKeywordOn} label={labels.requireKeyword}>
              <Input
                value={keywordText}
                onChange={(e) => setKeywordText(e.target.value)}
                placeholder={labels.keywordPlaceholder}
                disabled={!keywordOn}
                className="h-7 flex-1 basis-40 text-xs"
              />
            </ConditionRow>
            <ConditionRow
              checked={mentionsOn}
              onChange={setMentionsOn}
              label={labels.requireMentions}
            >
              <Input
                type="number"
                min={1}
                value={mentionsCount}
                onChange={(e) => setMentionsCount(e.target.value)}
                placeholder={labels.mentionsPlaceholder}
                disabled={!mentionsOn}
                className="h-7 w-20 text-xs tabular-nums"
              />
            </ConditionRow>
            <ConditionRow checked={beforeOn} onChange={setBeforeOn} label={labels.beforeTime}>
              <Input
                type="datetime-local"
                value={beforeText}
                onChange={(e) => setBeforeText(e.target.value)}
                disabled={!beforeOn}
                className="h-7 flex-1 basis-44 text-xs tabular-nums"
              />
            </ConditionRow>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {labels.manualCheckHint}
            </p>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
              {labels.prizes}
            </h3>
            {prizes.length > 0 && (
              <ul className="space-y-1.5">
                {prizes.map((p) => (
                  <li
                    key={p.id}
                    className="bg-muted/40 flex items-center justify-between gap-2 rounded-lg py-1 pr-1 pl-3 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      {p.name}{" "}
                      <span className="text-muted-foreground tabular-nums">× {p.count}</span>
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={labels.removePrize}
                      title={labels.removePrize}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => setPrizes((prev) => prev.filter((x) => x.id !== p.id))}
                    >
                      <X />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center gap-2">
              <Input
                value={prizeName}
                onChange={(e) => setPrizeName(e.target.value)}
                placeholder={labels.prizeNamePlaceholder}
                className="min-w-0 flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") addPrize();
                }}
              />
              <Input
                type="number"
                min={1}
                value={prizeCount}
                onChange={(e) => setPrizeCount(e.target.value)}
                placeholder={labels.prizeCountPlaceholder}
                className="w-20 tabular-nums"
                onKeyDown={(e) => {
                  if (e.key === "Enter") addPrize();
                }}
              />
              <Button variant="secondary" onClick={addPrize} disabled={!prizeName.trim()}>
                {labels.addPrize}
              </Button>
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={() => (results ? setRedrawConfirmOpen(true) : draw())}
            disabled={!canDraw}
          >
            {results ? labels.redraw : labels.draw}
            {totalPrizeCount > 0 && (
              <span className="text-primary-foreground/60 tabular-nums">{totalPrizeCount}</span>
            )}
          </Button>

          {/* Redrawing discards results that can't be reproduced; focus lands on Cancel. */}
          <Dialog open={redrawConfirmOpen} onOpenChange={setRedrawConfirmOpen}>
            <DialogContent showCloseButton={false} className="max-w-sm">
              <DialogHeader>
                <DialogTitle>{labels.redrawConfirmTitle}</DialogTitle>
                <DialogDescription>{labels.redrawConfirmBody}</DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => setRedrawConfirmOpen(false)}
                >
                  {labels.cancel}
                </Button>
                <Button
                  type="button"
                  className="rounded-full"
                  onClick={() => {
                    setRedrawConfirmOpen(false);
                    draw();
                  }}
                >
                  {labels.redraw}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <div className="flex min-w-0 flex-col gap-4 lg:col-span-3">
        {results && (
          <Card
            ref={resultsRef}
            className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both scroll-mt-16 duration-300 motion-reduce:animate-none"
          >
            <CardHeader className="border-b">
              <CardTitle>{labels.results}</CardTitle>
              {drawnAt && (
                <CardDescription className="text-xs tabular-nums">
                  {drawStats &&
                    `${labels.drawSummary
                      .replace("{won}", String(drawStats.won))
                      .replace("{pool}", String(drawStats.pool))} · `}
                  {labels.drawnAt.replace("{time}", dateTimeFmt.format(drawnAt))}
                </CardDescription>
              )}
              <CardAction>
                <Button variant="outline" size="xs" onClick={copyResults}>
                  <Copy className="size-3" />
                  {labels.copyResults}
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {drawShortfall !== null && (
                  <p className="bg-muted/70 text-muted-foreground rounded-lg px-3 py-2 text-xs">
                    {labels.notEnoughEntries.replace("{count}", String(drawShortfall))}
                  </p>
                )}
                {results.map((r, idx) => (
                  <div key={idx} className="space-y-2">
                    <h3 className="flex items-center gap-1.5 text-sm font-semibold">
                      <Trophy className="text-tint size-4" />
                      {r.prizeName}
                      <span className="text-muted-foreground font-normal tabular-nums">
                        × {r.winners.length}
                      </span>
                    </h3>
                    <ul className="space-y-2">
                      {r.winners.map((w, i) => (
                        <li
                          key={`${drawnAt?.getTime()}-${w.id}`}
                          style={{
                            animationDelay: `${Math.min(((revealOffsets[idx] as number) + i) * 45, 450)}ms`,
                          }}
                          className="bg-muted/40 animate-in fade-in slide-in-from-bottom-2 fill-mode-both rounded-lg px-3 py-2 duration-300 motion-reduce:animate-none"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <a
                              href={w.permalink || `https://www.threads.net/@${w.username}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex min-w-0 items-center gap-1.5 text-sm font-medium hover:underline"
                            >
                              <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                                {i + 1}
                              </span>
                              <span className="truncate">@{w.username}</span>
                              <ExternalLink className="text-muted-foreground size-3 shrink-0" />
                            </a>
                            <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                              {dateTimeFmt.format(new Date(w.timestamp))}
                            </span>
                          </div>
                          {w.text && (
                            <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-relaxed">
                              {w.text}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {replies && loadedPost ? (
          <Card>
            <CardHeader className="border-b">
              <CardTitle>{labels.postInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <a
                href={loadedPost.permalink || undefined}
                target="_blank"
                rel="noreferrer"
                className="group block space-y-1"
              >
                <p className="line-clamp-3 text-sm leading-relaxed group-hover:underline">
                  {loadedPost.text.trim() ? loadedPost.text : loadedPost.id}
                </p>
                <p className="text-muted-foreground flex items-center gap-1 text-xs tabular-nums">
                  {dateTimeFmt.format(new Date(loadedPost.timestamp))}
                  <ExternalLink className="size-3" />
                </p>
              </a>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
                    {labels.statReplies}
                  </p>
                  <p className="mt-0.5 text-2xl font-semibold tracking-[-0.01em] tabular-nums">
                    {replies.length}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
                    {labels.statAccounts}
                  </p>
                  <p className="mt-0.5 text-2xl font-semibold tracking-[-0.01em] tabular-nums">
                    {uniqueAccounts}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
                    {labels.eligibleEntries}
                  </p>
                  <p className="text-tint mt-0.5 text-2xl font-semibold tracking-[-0.01em] tabular-nums">
                    {eligible.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="lg:flex-1">
            <CardContent className="flex flex-1 flex-col items-center justify-center gap-2 py-16">
              <Trophy className="text-muted-foreground/40 size-6" />
              <p className="text-muted-foreground text-sm">{labels.noResults}</p>
              <p className="text-muted-foreground/70 text-xs">{labels.emptyHint}</p>
            </CardContent>
          </Card>
        )}

        {replies && (
          <Card className="lg:flex-1">
            <CardHeader className="border-b">
              <CardTitle>{labels.entriesTitle}</CardTitle>
              <CardAction>
                <span className="text-muted-foreground text-xs tabular-nums">
                  <span className="text-tint font-semibold">{eligible.length}</span> /{" "}
                  {replies.length}
                </span>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              {eligible.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm lg:my-auto">
                  {labels.entriesEmpty}
                </p>
              ) : (
                <>
                  <div className="relative mb-3">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
                    <input
                      ref={entrySearchRef}
                      type="search"
                      value={entrySearch}
                      onChange={(e) => setEntrySearch(e.target.value)}
                      placeholder={labels.entriesSearchPlaceholder}
                      className="bg-muted/70 placeholder:text-muted-foreground focus-visible:ring-ring/40 w-full rounded-full py-1.5 pr-9 pl-9 text-sm transition-[background-color,box-shadow] duration-150 outline-none focus-visible:ring-2 motion-reduce:transition-none [&::-webkit-search-cancel-button]:hidden"
                    />
                    {entrySearch.length > 0 && (
                      <button
                        type="button"
                        aria-label={labels.clearSearch}
                        onClick={() => {
                          setEntrySearch("");
                          entrySearchRef.current?.focus();
                        }}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted absolute top-1/2 right-1.5 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-full transition-[background-color,color,transform] duration-150 active:scale-90 motion-reduce:transition-none motion-reduce:active:scale-100"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                  {visibleEntries.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center text-sm lg:my-auto">
                      {labels.entriesSearchEmpty}
                    </p>
                  ) : (
                    <>
                      <ul className="divide-border/60 scrollbar-subtle -mr-2 max-h-96 divide-y overflow-y-auto lg:grow">
                        {visibleEntries.slice(0, ENTRY_DISPLAY_LIMIT).map((r) => (
                          <li
                            key={r.id}
                            className="flex items-baseline gap-2 py-2 text-sm first:pt-0 last:pb-0"
                          >
                            <a
                              href={r.permalink || `https://www.threads.net/@${r.username}`}
                              target="_blank"
                              rel="noreferrer"
                              className="max-w-40 shrink-0 truncate font-medium hover:underline"
                            >
                              @{r.username}
                            </a>
                            <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
                              {r.text}
                            </span>
                            <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                              {dateTimeFmt.format(new Date(r.timestamp))}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {visibleEntries.length > ENTRY_DISPLAY_LIMIT && (
                        <p className="text-muted-foreground border-t pt-2 text-center text-xs">
                          {labels.entriesMore.replace(
                            "{count}",
                            String(visibleEntries.length - ENTRY_DISPLAY_LIMIT),
                          )}
                        </p>
                      )}
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
