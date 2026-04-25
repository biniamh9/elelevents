import Button from "@/components/ui/button";

export default function PageCTA({
  eyebrow = "Book consultation",
  title,
  description,
  showSecondary = true,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  showSecondary?: boolean;
}) {
  return (
    <section className="cta-shell cta-shell--editorial" data-reveal>
      <div className="cta-shell__copy" data-reveal-child style={{ ["--reveal-delay" as string]: "0ms" }}>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p className="lead">{description}</p>
        <small className="cta-shell__microcopy">
          We accept a limited number of events each month.
        </small>
      </div>

      <div className="btn-row cta-shell__actions" data-reveal-child style={{ ["--reveal-delay" as string]: "120ms" }}>
        <Button href="/request">Book Consultation</Button>
        {showSecondary ? (
          <Button href="/gallery" variant="secondary" arrow>
            View Portfolio
          </Button>
        ) : null}
      </div>
    </section>
  );
}
