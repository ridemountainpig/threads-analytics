import { AlignLeft, CalendarDays, FileText, Flame, Hash, X } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

type FeatureIndex = "01" | "02" | "03" | "04" | "05" | "06";

export function FeatureGrid({ copy }: { copy: Dictionary["features"] }) {
  return (
    <div className="feature-grid render-deferred">
      {copy.items.map((feature) => {
        const featureIndex = feature.index as FeatureIndex;

        return (
          <article className="feature-card" data-reveal="up" key={feature.index}>
            <div className="feature-card-top">
              <span>{feature.index}</span>
              <span>{feature.tag}</span>
            </div>

            {featureIndex === "02" ? (
              <div className="feature-art feature-art-02" aria-hidden="true">
                <div className="format-length-pair">
                  <div className="format-length-option is-format">
                    <FileText strokeWidth={1.8} />
                    <div>
                      <small>{copy.formatLengthVisual.formatLabel}</small>
                      <strong>{copy.formatLengthVisual.formatValue}</strong>
                    </div>
                  </div>
                  <span className="format-length-cross-cell">
                    <X className="format-length-cross" strokeWidth={1.8} />
                  </span>
                  <div className="format-length-option is-length">
                    <AlignLeft strokeWidth={1.8} />
                    <div>
                      <small>{copy.formatLengthVisual.lengthLabel}</small>
                      <strong>{copy.formatLengthVisual.lengthValue}</strong>
                    </div>
                  </div>
                </div>
                <div className="format-length-result">
                  <div>
                    <small>{copy.formatLengthVisual.resultLabel}</small>
                    <strong>{copy.formatLengthVisual.resultValue}</strong>
                  </div>
                  <b>{copy.formatLengthVisual.lift}</b>
                </div>
              </div>
            ) : featureIndex === "04" ? (
              <div className="feature-art feature-art-04" aria-hidden="true">
                <div className="content-signal-topics">
                  <div className="content-signal-label">
                    <Hash strokeWidth={1.8} />
                    <small>{copy.contentSignalsVisual.keywordsLabel}</small>
                  </div>
                  <div className="content-signal-chips">
                    {copy.contentSignalsVisual.keywords.map((keyword, index) => (
                      <b className={index === 0 ? "is-leading" : undefined} key={keyword}>
                        {keyword}
                      </b>
                    ))}
                  </div>
                </div>
                <div className="content-signal-cadence">
                  <div className="content-signal-label">
                    <CalendarDays strokeWidth={1.8} />
                    <small>{copy.contentSignalsVisual.cadenceLabel}</small>
                  </div>
                  <div className="cadence-track">
                    {copy.contentSignalsVisual.days.map((day, index) => (
                      <div
                        className={[0, 2, 3, 5].includes(index) ? "is-posted" : undefined}
                        key={`${day}-${index}`}
                      >
                        <i />
                        <small>{day}</small>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="content-signal-summary">
                  <strong>
                    <Flame strokeWidth={1.9} />
                    {copy.contentSignalsVisual.streak}
                  </strong>
                  <small>{copy.contentSignalsVisual.frequency}</small>
                </div>
              </div>
            ) : (
              <div className={`feature-art feature-art-${feature.index}`} aria-hidden="true">
                {Array.from({ length: 6 }, (_, index) => (
                  <span
                    style={featureIndex === "01" ? { transformOrigin: "bottom" } : undefined}
                    key={index}
                  />
                ))}
              </div>
            )}

            <h3>{feature.title}</h3>
            <p>{feature.body}</p>
          </article>
        );
      })}
    </div>
  );
}
