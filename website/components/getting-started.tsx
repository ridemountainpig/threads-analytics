import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { gettingStarted } from "@/lib/getting-started";
import type { Locale } from "@/lib/locales";

export function GettingStarted({ locale }: { locale: Locale }) {
  const copy = gettingStarted[locale];

  return (
    <section
      className="getting-started-section"
      id="getting-started"
      aria-labelledby="getting-started-title"
    >
      <div className="site-shell">
        <div className="section-heading">
          <p className="section-kicker">{copy.kicker}</p>
          <h2 id="getting-started-title">{copy.title}</h2>
          <p className="section-description">{copy.description}</p>
        </div>
        <div className="getting-started-grid">
          {copy.items.map((item) => (
            <article className="getting-started-item" key={item.question}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
        <div className="getting-started-links">
          <Link href={`/${locale}/token-guide`}>
            {copy.tokenLink}
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
          <Link href={`/${locale}/analytics`}>
            {copy.chartsLink}
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
