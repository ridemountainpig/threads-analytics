export const runtimeTarget =
  process.env.NEXT_PUBLIC_RUNTIME_TARGET === "desktop" ? "desktop" : "web";

export const isDesktopApp = runtimeTarget === "desktop";
