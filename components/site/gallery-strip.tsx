type GalleryStripItem = {
  id: string;
  imageUrl: string;
  title: string;
  label?: string | null;
};

export default function GalleryStrip({
  title,
  items,
}: {
  title: string;
  items: GalleryStripItem[];
}) {
  return (
    <section className="gallery-strip-shell">
      <div className="section-heading">
        <p className="eyebrow">Visual highlights</p>
        <h2>{title}</h2>
      </div>
      <div className="gallery-strip">
        {items.map((item) => (
          <article key={item.id} className="gallery-strip-item">
            <img src={item.imageUrl} alt={item.title} />
            <div className="gallery-strip-caption">
              <span>{item.label || "Event detail"}</span>
              <strong>{item.title}</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
