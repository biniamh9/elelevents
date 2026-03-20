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
        <p className="eyebrow">How it works</p>
        <h2>A simple, guided process from inquiry to event day.</h2>
        <p className="muted">A simple, guided process from inquiry to execution.</p>
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
                <span className="simple-process-index">{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
              </button>

              {index < steps.length - 1 ? (
                <div className={`simple-process-connector ${isActive ? "is-active" : ""}`} aria-hidden="true">
                  <svg viewBox="0 0 20 20">
                    <path
                      d="M4 10h10m0 0-4-4m4 4-4 4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
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
          <span className="simple-process-panel-kicker">
            Step {String(activeIndex + 1).padStart(2, "0")}
          </span>
          <h3>{activeStep.title}</h3>
          <p>{activeStep.text}</p>
          <span className="simple-process-panel-note">Every step is personalized to your event priorities.</span>
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
