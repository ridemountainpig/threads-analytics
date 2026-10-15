"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type TodayView = "posts" | "replies";

// replaceState keeps ?view= without adding history entries.
function writeView(next: TodayView) {
  const params = new URLSearchParams(window.location.search);
  if (next === "posts") params.delete("view");
  else params.set("view", next);
  const query = params.toString();
  window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
}

export default function TodayViews({
  initialView,
  aside,
  posts,
  replies,
  labels,
}: {
  initialView: TodayView;
  aside: ReactNode;
  posts: ReactNode;
  replies: ReactNode;
  labels: { posts: string; replies: string };
}) {
  const [view, setView] = useState<TodayView>(initialView);

  const select = (next: unknown) => {
    if (next !== "posts" && next !== "replies") return;
    setView(next);
    writeView(next);
  };

  // A plain #replies link (the awaiting tile) switches tabs on phones and scrolls on both.
  useEffect(() => {
    const showReplies = () => {
      if (window.location.hash !== "#replies") return;
      setView("replies");
      writeView("replies");
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      requestAnimationFrame(() =>
        document
          .getElementById("replies")
          ?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" }),
      );
    };
    // Back from a tile tap returns to the tab the URL now names.
    const followUrl = () => {
      const fromUrl = new URLSearchParams(window.location.search).get("view");
      setView(fromUrl === "replies" ? "replies" : "posts");
    };
    showReplies();
    window.addEventListener("hashchange", showReplies);
    window.addEventListener("popstate", followUrl);
    return () => {
      window.removeEventListener("hashchange", showReplies);
      window.removeEventListener("popstate", followUrl);
    };
  }, []);

  return (
    // auto + 1fr keeps the aside at its own height beside the spanning posts.
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:grid-rows-[auto_1fr] lg:items-start">
      <Tabs value={view} onValueChange={select} className="lg:hidden">
        <TabsList className="bg-muted/70 rounded-full p-0.5">
          <TabsTrigger value="posts" className="rounded-full px-3">
            {labels.posts}
          </TabsTrigger>
          <TabsTrigger value="replies" className="rounded-full px-3">
            {labels.replies}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div
        className={cn(
          "min-w-0 lg:col-span-2 lg:col-start-1 lg:row-span-2 lg:row-start-1",
          view !== "posts" && "hidden lg:block",
        )}
      >
        {posts}
      </div>
      <div
        id="replies"
        className={cn(
          "min-w-0 scroll-mt-20 md:scroll-mt-6 lg:col-start-3 lg:row-start-2",
          view !== "replies" && "hidden lg:block",
        )}
      >
        {replies}
      </div>
      <div className="min-w-0 lg:col-start-3 lg:row-start-1">{aside}</div>
    </div>
  );
}
