import type { ComponentProps, ReactNode } from "react";
import TimeRangePicker from "@/components/dashboard/time-range-picker";
import SyncButton, {
  LastSynced,
  StaleSyncBanner,
  type SyncButtonProps,
} from "@/components/dashboard/sync-button";
import { cn } from "@/lib/utils";

// Shared with PageHeaderSkeleton so the loading state wraps at the same breakpoints.
const rowClass = "flex flex-wrap items-start gap-3 lg:flex-nowrap lg:items-center lg:gap-x-4";
const titleColumnClass = "min-w-0 flex-1 lg:mr-auto lg:flex-initial";
const titleClass = "text-2xl font-bold tracking-[-0.02em]";
const rangeClass = "order-1 min-w-0 basis-full lg:order-none lg:basis-auto";
const actionsClass = "mt-0.5 flex shrink-0 items-center gap-2 lg:mt-0";

// Below lg: title and actions share the first row, the range gets its own.
// From lg: one row, in DOM order.
export default function PageHeader({
  title,
  subtitle,
  range,
  sync,
  actions,
}: {
  title: string;
  subtitle: ReactNode;
  range?: ComponentProps<typeof TimeRangePicker>;
  sync: SyncButtonProps;
  actions?: ReactNode;
}) {
  return (
    <div className={rowClass}>
      <div className={titleColumnClass}>
        <h1 className={titleClass}>{title}</h1>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
        <LastSynced {...sync} className="mt-0.5 sm:hidden" />
      </div>
      {range && (
        <div className={rangeClass}>
          <TimeRangePicker {...range} />
        </div>
      )}
      <div className={actionsClass}>
        {actions}
        <SyncButton {...sync} compact />
      </div>
      <StaleSyncBanner {...sync} className="order-2" />
    </div>
  );
}

const bar = "bg-muted inline-block rounded-md align-middle";

export function PageHeaderSkeleton({ range = false }: { range?: boolean }) {
  return (
    <div aria-hidden className={rowClass}>
      <div className={titleColumnClass}>
        <p className={titleClass}>
          <span className={cn(bar, "h-6 w-36")} />
        </p>
        <p className="text-sm">
          <span className={cn(bar, "bg-muted/70 h-3.5 w-52")} />
        </p>
        <p className="mt-0.5 text-xs sm:hidden">
          <span className={cn(bar, "bg-muted/70 h-3 w-40")} />
        </p>
      </div>
      {range && (
        <div className={rangeClass}>
          {/* Bleeds into the gutter below sm like the picker's scrolling chip row. */}
          <div className="-mx-4 flex gap-1.5 overflow-hidden px-4 py-0.5 sm:mx-0 sm:px-0 lg:justify-end">
            {Array.from({ length: 7 }, (_, i) => (
              <span
                key={i}
                className="bg-muted h-7 w-12 shrink-0 rounded-full pointer-coarse:h-8"
              />
            ))}
          </div>
        </div>
      )}
      <div className={cn(actionsClass, "gap-3")}>
        <span className="bg-muted/70 hidden h-3 w-40 rounded-md sm:block" />
        <span className="bg-muted h-7 w-16 rounded-full" />
      </div>
    </div>
  );
}
