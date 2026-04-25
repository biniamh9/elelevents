import type { ReactNode } from "react";

type StorySectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  imageAlt: string;
  reverse?: boolean;
  tags?: string[];
  children?: ReactNode;
};

export default function StorySection({
  eyebrow,
  title,
  description,
  imageUrl,
  imageAlt,
  reverse = false,
  tags = [],
  children,
}: StorySectionProps) {
  return (
    <section className={`story-feature ${reverse ? "is-reversed" : ""}`} data-reveal>
      <div className="story-feature-media" data-reveal-child style={{ ["--reveal-delay" as string]: "0ms" }}>
        {imageUrl ? <img src={imageUrl} alt={imageAlt} /> : null}
        {tags.length ? (
          <div className="story-feature-tags">
            {tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="story-feature-copy" data-reveal-child style={{ ["--reveal-delay" as string]: "120ms" }}>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="lead">{description}</p>
        {children}
      </div>
    </section>
  );
}
