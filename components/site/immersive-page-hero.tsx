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
    <section className="immersive-page-hero" data-reveal>
      <div className="immersive-page-hero-media" data-reveal-child style={{ ["--reveal-delay" as string]: "0ms" }}>
        {imageUrl ? <img src={imageUrl} alt={imageAlt} /> : null}
        <div className="immersive-page-hero-overlay" />
        <div className="immersive-page-hero-copy">
          <p className="eyebrow immersive-page-hero-copy__reveal immersive-page-hero-copy__reveal--1">{eyebrow}</p>
          <h1 className="immersive-page-hero-copy__reveal immersive-page-hero-copy__reveal--2">{title}</h1>
          <p className="lead immersive-page-hero-copy__reveal immersive-page-hero-copy__reveal--3">{description}</p>
          {tags.length ? (
            <div className="immersive-page-hero-tags immersive-page-hero-copy__reveal immersive-page-hero-copy__reveal--4">
              {tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {aside ? (
        <div className="immersive-page-hero-aside" data-reveal-child style={{ ["--reveal-delay" as string]: "120ms" }}>
          {aside}
        </div>
      ) : null}
    </section>
  );
}
