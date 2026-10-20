"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SegmentedControl } from "@/components/charts/segmented-control";

type RepliesView = "received" | "sent";

export default function RepliesCard({
  received,
  sent,
  receivedCount,
  sentCount,
  initialView,
  labels,
}: {
  received: ReactNode;
  sent: ReactNode;
  receivedCount: number | null;
  sentCount: number | null;
  initialView: RepliesView;
  labels: {
    repliesTab: string;
    receivedTab: string;
    sentTab: string;
    repliesSub: string;
    myRepliesSub: string;
  };
}) {
  const [view, setView] = useState<RepliesView>(initialView);

  // The awaiting tile links to #replies, which is about replies received.
  useEffect(() => {
    const showReceived = () => {
      if (window.location.hash === "#replies") setView("received");
    };
    window.addEventListener("hashchange", showReceived);
    return () => window.removeEventListener("hashchange", showReceived);
  }, []);

  const withCount = (label: string, count: number | null) =>
    count === null ? label : `${label} ${count}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
            {labels.repliesTab}
          </CardTitle>
          <SegmentedControl
            value={view}
            onChange={setView}
            label={labels.repliesTab}
            className="shrink-0 tabular-nums"
            options={[
              { value: "received", label: withCount(labels.receivedTab, receivedCount) },
              { value: "sent", label: withCount(labels.sentTab, sentCount) },
            ]}
          />
        </div>
        <p className="text-muted-foreground text-xs">
          {view === "received" ? labels.repliesSub : labels.myRepliesSub}
        </p>
      </CardHeader>
      <CardContent>
        {/* Both stay mounted so each keeps its filter across switches. */}
        <div hidden={view !== "received"}>{received}</div>
        <div hidden={view !== "sent"}>{sent}</div>
      </CardContent>
    </Card>
  );
}
