import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "@/lib/utils";

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "bg-muted-foreground/25 data-checked:bg-tint focus-visible:ring-ring/50 inline-flex h-5 w-8 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="size-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out data-checked:translate-x-3 motion-reduce:transition-none"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
