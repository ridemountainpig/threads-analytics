import type { ReactNode } from "react";

/**
 * Centered kicker, title and lead (the homepage voice). The numbered variant
 * is the tutorial pages' voice: ruled off like a printed form, with a kicker
 * written "01 / Label" split into its number and label.
 */
export function SectionHead({
  kicker,
  title,
  description,
  variant = "centered",
  id,
  as: Heading = "h2",
}: {
  kicker: string;
  title: ReactNode;
  description?: ReactNode;
  variant?: "centered" | "numbered";
  id?: string;
  as?: "h1" | "h2";
}) {
  const lead = description ? <p className="section-head-lead">{description}</p> : null;

  if (variant === "numbered") {
    const match = kicker.match(/^(\d+)\s*\/\s*(.+)$/);
    return (
      <div className="section-head section-head-numbered">
        <div className="section-head-main">
          <p className="section-head-label">
            {match ? (
              <>
                <span className="section-head-number">{match[1]}</span>
                <span className="section-head-dash" aria-hidden="true" />
                {match[2]}
              </>
            ) : (
              kicker
            )}
          </p>
          <Heading className="section-head-title" id={id}>
            {title}
          </Heading>
        </div>
        {lead}
      </div>
    );
  }

  return (
    <div className="section-head">
      <p className="section-head-kicker">{kicker}</p>
      <Heading className="section-head-title" id={id}>
        {title}
      </Heading>
      {lead}
    </div>
  );
}
