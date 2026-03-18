import Button from "@/components/ui/button";

export default function PageCTA({
  eyebrow = "Book consultation",
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <section className="cta-shell cta-shell--editorial">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p className="lead">{description}</p>
      </div>

      <div className="btn-row">
        <Button href="/request">Book Consultation</Button>
        <Button href="/gallery" variant="secondary">View Portfolio</Button>
      </div>
    </section>
  );
}
