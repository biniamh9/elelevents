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
        {items.map((item) => (
          <Link key={item.id} href="/gallery" className="gallery-strip-item">
            <img src={item.imageUrl} alt={item.title} />
            {showCaption ? (
              <>
                <span className="gallery-strip-overlay" />
                <div className="gallery-strip-label">
                  <span>{item.label || "Event detail"}</span>
                </div>
              </>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
