import Link from "next/link";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import {
  buildSeoLandingSchema,
  sharedProcessSteps,
  type SeoLandingConfig,
} from "@/lib/seo-landing-pages";

type SeoLandingPageProps = {
  config: SeoLandingConfig;
};

export default function SeoLandingPage({ config }: SeoLandingPageProps) {
  const schema = buildSeoLandingSchema(config);

  return (
    <main className="container section public-page-shell seo-landing-page">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <nav className="seo-breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/services">Services</Link>
        <span aria-hidden="true">/</span>
        <span>{config.title}</span>
      </nav>

      <section className="seo-hero">
        <div className="seo-hero-copy">
          <p className="eyebrow">Atlanta Event Design</p>
          <h1>{config.heroTitle}</h1>
          <p className="lead">{config.heroDescription}</p>
          <div className="btn-row seo-hero-actions">
            <Button href="/request">Check Availability</Button>
            <Button href="/gallery" variant="secondary">
              View Portfolio
            </Button>
          </div>
          <p className="seo-trust-line">{config.trustLine}</p>
        </div>

        <Card className="seo-hero-aside" soft>
          <p className="eyebrow">Why clients inquire</p>
          <h2>{config.title}</h2>
          <p>{config.intro}</p>
          <ul className="seo-hero-points">
            {config.benefits.slice(0, 3).map((benefit) => (
              <li key={benefit.title}>{benefit.title}</li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="seo-section">
        <div className="section-heading section-heading--tight">
          <p className="eyebrow">Gallery Preview</p>
          <h2>Visual direction for {config.serviceLocation} celebrations.</h2>
        </div>
        <div className="seo-gallery-grid">
          {config.galleryImages.map((image) => (
            <article key={image.src} className="seo-gallery-card">
              <div className="seo-gallery-media">
                <img src={image.src} alt={image.alt} loading="lazy" />
                <span className="seo-gallery-overlay" />
              </div>
              <div className="seo-gallery-meta">
                <strong>{image.label}</strong>
                <span>{image.alt}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="seo-section">
        <div className="section-heading section-heading--tight">
          <p className="eyebrow">Why Choose Elel</p>
          <h2>Design support that feels polished from inquiry to installation.</h2>
        </div>
        <div className="seo-benefit-grid">
          {config.benefits.map((benefit) => (
            <Card key={benefit.title} className="seo-benefit-card">
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="seo-section seo-editorial-band">
        <div className="section-heading section-heading--tight">
          <p className="eyebrow">Service Details</p>
          <h2>{config.title} with a cohesive, room-aware design approach.</h2>
          <p className="lead">{config.intro}</p>
        </div>
        <div className="seo-service-grid">
          {config.serviceDetails.map((detail) => (
            <article key={detail.title} className="seo-service-detail">
              <h3>{detail.title}</h3>
              <p>{detail.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="seo-section">
        <div className="section-heading section-heading--tight">
          <p className="eyebrow">Our Process</p>
          <h2>A clear booking path with the same calm, luxury tone as the design.</h2>
        </div>
        <div className="seo-process-grid">
          {sharedProcessSteps.map((step, index) => (
            <Card key={step.title} className="seo-process-card">
              <span className="seo-process-number">0{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="seo-section seo-faq-shell">
        <div className="section-heading section-heading--tight">
          <p className="eyebrow">FAQ</p>
          <h2>Questions we hear before booking {config.title.toLowerCase()}.</h2>
        </div>
        <div className="seo-faq-list">
          {config.faqs.map((faq) => (
            <details key={faq.question} className="seo-faq-item">
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="seo-section">
        <div className="section-heading section-heading--tight">
          <p className="eyebrow">Related Links</p>
          <h2>Continue exploring Elel Events &amp; Design.</h2>
        </div>
        <div className="seo-related-grid">
          {config.relatedLinks.map((link) => (
            <Link key={link.href} href={link.href} className="seo-related-card">
              <strong>{link.label}</strong>
              <span>{link.description}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="cta-shell cta-shell--editorial seo-final-cta">
        <div>
          <span className="eyebrow">Start Planning</span>
          <h2>Elegant planning support for a celebration that deserves to feel beautifully finished.</h2>
          <p className="lead">
            If you are looking for {config.title.toLowerCase()} with a polished,
            thoughtful process, we would be glad to review your date, venue, and
            design direction.
          </p>
        </div>

        <div className="btn-row">
          <Button href="/request">Start Planning</Button>
          <Button href="/contact" variant="secondary">
            Contact Us
          </Button>
        </div>
      </section>
    </main>
  );
}
