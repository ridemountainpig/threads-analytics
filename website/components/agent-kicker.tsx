import Link from "next/link";
import type { ReactNode } from "react";

// Breadcrumb-style kicker for the agent deploy heroes. The dictionary string
// reads "<deploy hub> / <page>"; the hub half links back to the homepage
// deploy section so the three deploy pages aren't dead ends.
export function AgentKicker({
  locale,
  label,
  brandmark,
}: {
  locale: string;
  label: string;
  brandmark: ReactNode;
}) {
  const [hub, ...rest] = label.split(" / ");
  const page = rest.join(" / ");

  return (
    <p className="section-kicker">
      {brandmark}
      {page ? (
        <>
          <Link href={`/${locale}#deploy`} className="agent-kicker-link">
            {hub}
          </Link>
          <span aria-hidden="true">/</span>
          {page}
        </>
      ) : (
        label
      )}
    </p>
  );
}
