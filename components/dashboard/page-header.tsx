import type { ComponentProps, ReactNode } from "react";
import TimeRangePicker from "@/components/dashboard/time-range-picker";
import SyncButton, {
  LastSynced,
  StaleSyncBanner,
  type SyncButtonProps,
} from "@/components/dashboard/sync-button";

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
  range: ComponentProps<typeof TimeRangePicker>;
  sync: SyncButtonProps;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start gap-3 lg:flex-nowrap lg:items-center lg:gap-x-4">
      <div className="min-w-0 flex-1 lg:mr-auto lg:flex-initial">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
        <LastSynced {...sync} className="mt-0.5 sm:hidden" />
      </div>
      <div className="order-1 min-w-0 basis-full lg:order-none lg:basis-auto">
        <TimeRangePicker {...range} />
      </div>
      <div className="mt-0.5 flex shrink-0 items-center gap-2 lg:mt-0">
        {actions}
        <SyncButton {...sync} compact />
      </div>
      <StaleSyncBanner {...sync} className="order-2" />
    </div>
  );
}
