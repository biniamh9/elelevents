"use client";

import { useState } from "react";

type ProcessStep = {
  title: string;
  text: string;
  imageUrl?: string | null;
  imageLabel?: string | null;
};

const defaultImageLabels: Record<string, string> = {
  "Submit Request": "Start Here",
  Consultation: "Planning",
  "Quote + Contract": "Approval",
  "Secure Your Date": "Reserved",
  "Event Day": "Execution",
};

export default function HomeProcessFlow({
  steps,
}: {
  steps: ProcessStep[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeStep = steps[activeIndex];

  return (
    <section className="simple-process-shell">
      <div className="simple-process-head">
        <p className="eyebrow">Our process</p>
        <h2>A simple, guided process from inquiry to event day.</h2>
        <p className="muted">A clearly defined process that makes it easy to connect, collaborate, and feel confident every step of the way.</p>
      </div>

      <div className="simple-process-grid" role="tablist" aria-label="Booking process steps">
        {steps.map((item, index) => {
          const isActive = index === activeIndex;

          return (
            <div key={item.title} className="simple-process-step-wrap">
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`process-panel-${index}`}
                id={`process-tab-${index}`}
                className={`simple-process-card ${isActive ? "is-active" : ""}`}
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onClick={() => setActiveIndex(index)}
              >
                <span className="simple-process-index">{index + 1}</span>
              </button>

              <div className="simple-process-step-copy">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>

              {index < steps.length - 1 ? (
                <div className={`simple-process-connector ${isActive ? "is-active" : ""}`} aria-hidden="true">
                  <span />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div
        id={`process-panel-${activeIndex}`}
        role="tabpanel"
        aria-labelledby={`process-tab-${activeIndex}`}
        className="simple-process-panel"
      >
        <div key={activeIndex} className="simple-process-panel-copy">
          <span className="simple-process-panel-kicker">Step {activeIndex + 1}</span>
          <h3>{activeStep.title}</h3>
          <p>{activeStep.text}</p>
          <button type="button" className="simple-process-panel-cta">
            Start Now
          </button>
        </div>

        <div key={`media-${activeIndex}`} className="simple-process-panel-media">
          {activeStep.imageUrl ? (
            <img src={activeStep.imageUrl} alt={activeStep.title} />
          ) : (
            <div className="simple-process-panel-media-placeholder" aria-hidden="true" />
          )}
          <span className="simple-process-panel-media-label">
            {activeStep.imageLabel ?? defaultImageLabels[activeStep.title] ?? "Event Flow"}
          </span>
        </div>
      </div>
    </section>
  );
}
