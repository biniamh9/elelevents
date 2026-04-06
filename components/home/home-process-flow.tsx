"use client";

import { useMemo, useState } from "react";

type ProcessStep = {
  title: string;
  text: string;
  imageUrl?: string | null;
  imageLabel?: string | null;
};

type ProcessStepDetail = {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  imageCaption: string;
};

const stepDetailMap: Record<string, ProcessStepDetail> = {
  "Submit Request": {
    title: "Submit Request",
    description:
      "Tell us your date and event details so we can begin shaping your vision.",
    ctaLabel: "Start Now",
    ctaHref: "/request",
    imageCaption: "First look",
  },
  Consultation: {
    title: "Consultation",
    description:
      "We align on your style, scope, priorities, and the overall event experience you want to create.",
    ctaLabel: "Book Consultation",
    ctaHref: "/request",
    imageCaption: "Planning call",
  },
  "Quote + Contract": {
    title: "Quote + Contract",
    description:
      "You receive your custom pricing, proposal details, and agreement with clarity on next steps.",
    ctaLabel: "View Process",
    ctaHref: "/#process",
    imageCaption: "Proposal ready",
  },
  "Secure Your Date": {
    title: "Secure Your Date",
    description:
      "Once your agreement is signed and deposit is paid, your event date is officially reserved.",
    ctaLabel: "Reserve Your Date",
    ctaHref: "/request",
    imageCaption: "Date secured",
  },
  "Event Day": {
    title: "Event Day",
    description:
      "Walk into a beautifully styled celebration with details thoughtfully prepared and executed.",
    ctaLabel: "See Gallery",
    ctaHref: "/gallery",
    imageCaption: "Event reveal",
  },
};

const fallbackImageLabels: Record<string, string> = {
  "Submit Request": "Inquire",
  Consultation: "Consult",
  "Quote + Contract": "Proposal",
  "Secure Your Date": "Reserved",
  "Event Day": "Event day",
};

function getStepDetail(step: ProcessStep) {
  return (
    stepDetailMap[step.title] ?? {
      title: step.title,
      description: step.text,
      ctaLabel: "Learn More",
      ctaHref: "/request",
      imageCaption: step.imageLabel ?? fallbackImageLabels[step.title] ?? "Process",
    }
  );
}

export default function HomeProcessFlow({
  steps,
}: {
  steps: ProcessStep[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeStep = steps[activeIndex];
  const activeDetail = useMemo(() => getStepDetail(activeStep), [activeStep]);

  return (
    <section className="process-flow-shell">
      <div className="process-flow-head">
        <p className="eyebrow">Our process</p>
        <h2>A simple, guided process from inquiry to event day.</h2>
        <p className="muted">
          A clearly defined process that makes it easy to connect, collaborate, and feel
          confident every step of the way.
        </p>
      </div>

      <div className="process-flow-timeline" role="tablist" aria-label="Booking process steps">
        {steps.map((step, index) => {
          const isActive = activeIndex === index;

          return (
            <div key={step.title} className="process-flow-step-wrap">
              <button
                type="button"
                role="tab"
                id={`process-flow-tab-${index}`}
                aria-controls={`process-flow-panel-${index}`}
                aria-selected={isActive}
                className={`process-flow-step ${isActive ? "is-active" : ""}`}
                onClick={() => setActiveIndex(index)}
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
              >
                <span className="process-flow-step-index">{index + 1}</span>
                <div className="process-flow-step-copy">
                  <strong>{step.title}</strong>
                  <small>{getStepDetail(step).description}</small>
                </div>
              </button>

              {index < steps.length - 1 ? (
                <div
                  className={`process-flow-step-connector ${isActive || activeIndex > index ? "is-active" : ""}`}
                  aria-hidden="true"
                >
                  <span />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div
        id={`process-flow-panel-${activeIndex}`}
        role="tabpanel"
        aria-labelledby={`process-flow-tab-${activeIndex}`}
        className="process-flow-feature"
      >
        <div key={`copy-${activeIndex}`} className="process-flow-feature-copy">
          <span className="process-flow-feature-kicker">Step {activeIndex + 1}</span>
          <h3>{activeDetail.title}</h3>
          <p>{activeDetail.description}</p>
          <a href={activeDetail.ctaHref} className="process-flow-feature-cta">
            {activeDetail.ctaLabel}
          </a>
        </div>

        <div key={`media-${activeIndex}`} className="process-flow-feature-media">
          {activeStep.imageUrl ? (
            <img src={activeStep.imageUrl} alt={activeStep.title} />
          ) : (
            <div className="process-flow-feature-placeholder" aria-hidden="true" />
          )}
          <span className="process-flow-feature-caption">
            {activeStep.imageLabel ??
              activeDetail.imageCaption ??
              fallbackImageLabels[activeStep.title] ??
              "Event flow"}
          </span>
        </div>
      </div>
    </section>
  );
}
