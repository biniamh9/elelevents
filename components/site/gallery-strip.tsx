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
  showCaption = true,
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
        {items.map((item, index) => (
          <Link
            key={item.id}
            href={`/gallery/${item.id}`}
            className="gallery-strip-item"
            data-reveal-child
            style={{ ["--reveal-delay" as string]: `${80 + index * 90}ms` }}
          >
            <img src={item.imageUrl} alt={item.title} />
            <span className="gallery-strip-overlay" />
            <div className="gallery-strip-label">
              {showCaption ? <span>{item.label || "Event detail"}</span> : null}
              <strong>{item.title}</strong>
              <small>View Experience</small>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
