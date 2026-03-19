import Link from "next/link";

type GalleryStripItem = {
  id: string;
  imageUrl: string;
  title: string;
  label?: string | null;
};

export default function GalleryStrip({
  eyebrow = "Recent Work",
  title,
  items,
  showCaption = false,
}: {
  eyebrow?: string;
  title: string;
  items: GalleryStripItem[];
  showCaption?: boolean;
}) {
  return (
    <section className="gallery-strip-shell">
      <div className="section-heading">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      <div className="gallery-strip">
        {items.map((item) => (
          <Link key={item.id} href="/gallery" className="gallery-strip-item">
            <img src={item.imageUrl} alt={item.title} />
            {showCaption ? (
              <div className="gallery-strip-caption">
                <span>{item.label || "Event detail"}</span>
                <strong>{item.title}</strong>
              </div>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
