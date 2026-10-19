import type { ReactNode } from "react";

export function Frame({
  label,
  actions,
  className,
  children,
}: {
  /** Mono text in the bar, such as a URL or file path. */
  label?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className ? `frame ${className}` : "frame"}>
      {label || actions ? (
        <div className="frame-bar">
          {label ? <span className="frame-label">{label}</span> : <span />}
          {actions ? <div className="frame-actions">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
