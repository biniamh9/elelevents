import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import PageCTA from "@/components/site/page-cta";
import Card from "@/components/ui/card";
import { getPortfolioDetailById } from "@/lib/gallery";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const detail = await getPortfolioDetailById(id);

  if (!detail) {
    return {
      title: "Portfolio experience not found | Elel Events & Design",
    };
  }

  return {
    title: `${detail.title} | Portfolio | Elel Events & Design`,
    description: detail.description,
    alternates: {
      canonical: `https://elelevents.com/gallery/${detail.item.id}`,
    },
    openGraph: {
      title: `${detail.title} | Portfolio | Elel Events & Design`,
      description: detail.description,
      images: detail.item.image_url ? [{ url: detail.item.image_url }] : [],
    },
  };
}

export default async function PortfolioDetailPage({ params }: PageProps) {
  const { id } = await params;
  const detail = await getPortfolioDetailById(id);

  if (!detail) {
    notFound();
  }

  return (
    <main className="portfolio-detail-page">
      <section className="portfolio-detail-hero">
        <img src={detail.item.image_url} alt={detail.title} className="portfolio-detail-hero__image" />
        <div className="portfolio-detail-hero__overlay" />

        <div className="container portfolio-detail-hero__content">
          <Link href="/gallery" className="portfolio-detail-hero__back">
            Back to Portfolio
          </Link>
          <span className="portfolio-detail-hero__eyebrow">{detail.categoryLabel}</span>
          <h1>{detail.title}</h1>
          <p>{detail.description}</p>

          <div className="portfolio-detail-hero__actions">
            <Link href="/request" className="btn">
              Design My Event Like This
            </Link>
            <Link href="/contact" className="btn secondary">
              Book Consultation
            </Link>
          </div>
        </div>
      </section>

      <section className="portfolio-detail-section">
        <div className="container portfolio-detail-shell">
          <div className="portfolio-detail-intro">
            <div className="portfolio-detail-copy">
              <span>Event Story</span>
              <h2>A visual direction built for emotion, atmosphere, and memorable guest experience.</h2>
              <p>
                Every focal point in this event was designed to feel layered and intentional,
                balancing statement styling with the kind of restraint that makes the room feel
                expensive, calm, and complete.
              </p>
            </div>

            <Card className="portfolio-detail-meta">
              <div>
                <span>Venue</span>
                <strong>{detail.location}</strong>
              </div>
              <div>
                <span>Guest count</span>
                <strong>{detail.guestCount}</strong>
              </div>
              <div>
                <span>Style</span>
                <strong>{detail.styleTag}</strong>
              </div>
              <div>
                <span>Event type</span>
                <strong>{detail.categoryLabel}</strong>
              </div>
            </Card>
          </div>

          <div className="portfolio-detail-sections">
            {detail.sections.map((section) => (
              <section key={section.title} className="portfolio-gallery-section">
                <div className="portfolio-gallery-section__head">
                  <span>{section.title}</span>
                  <h3>{section.title} moments</h3>
                  <p>{section.description}</p>
                </div>

                <div className="portfolio-gallery-section__grid">
                  {section.items.map((item, index) => (
                    <article
                      key={`${section.title}-${item.id}-${index}`}
                      className={`portfolio-gallery-section__card${index === 0 ? " is-featured" : ""}`}
                    >
                      <img src={item.image_url} alt={item.title} />
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>

      <PageCTA
        eyebrow="Inspired by this event?"
        title="Design My Event Like This"
        description="Bring this same level of atmosphere, polish, and visual storytelling into your own celebration."
      />
    </main>
  );
}
