import type { ReactNode } from "react";

type ImmersivePageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  imageAlt: string;
  tags?: string[];
  aside?: ReactNode;
};

export default function ImmersivePageHero({
  eyebrow,
  title,
  description,
  imageUrl,
  imageAlt,
  tags = [],
  aside,
}: ImmersivePageHeroProps) {
  return (
    <section className="immersive-page-hero">
      <div className="immersive-page-hero-media">
        {imageUrl ? <img src={imageUrl} alt={imageAlt} /> : null}
        <div className="immersive-page-hero-overlay" />
        <div className="immersive-page-hero-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="lead">{description}</p>
          {tags.length ? (
            <div className="immersive-page-hero-tags">
              {tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {aside ? <div className="immersive-page-hero-aside">{aside}</div> : null}
    </section>
  );
}
