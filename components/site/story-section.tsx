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
    <section className={`story-feature ${reverse ? "is-reversed" : ""}`}>
      <div className="story-feature-media">
        {imageUrl ? <img src={imageUrl} alt={imageAlt} /> : null}
        {tags.length ? (
          <div className="story-feature-tags">
            {tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="story-feature-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="lead">{description}</p>
        {children}
      </div>
    </section>
  );
}
