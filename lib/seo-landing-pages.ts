import type { Metadata } from "next";

export type SeoLandingBenefit = {
  title: string;
  description: string;
};

export type SeoLandingFaq = {
  question: string;
  answer: string;
};

export type SeoLandingGalleryImage = {
  src: string;
  alt: string;
  label: string;
};

export type SeoLandingServiceDetail = {
  title: string;
  body: string;
};

export type SeoLandingRelatedLink = {
  href: string;
  label: string;
  description: string;
};

export type SeoLandingConfig = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  heroTitle: string;
  heroDescription: string;
  trustLine: string;
  intro: string;
  benefits: SeoLandingBenefit[];
  galleryImages: SeoLandingGalleryImage[];
  serviceDetails: SeoLandingServiceDetail[];
  faqs: SeoLandingFaq[];
  relatedLinks: SeoLandingRelatedLink[];
  schemaServiceName: string;
  serviceLocation: string;
};

const siteUrl = "https://elelevents.com";
const businessName = "Elel Events & Design";

export function getSeoLandingPageEntries() {
  return Object.values(seoLandingPages);
}

export const sharedProcessSteps = [
  {
    title: "Submit Request",
    description:
      "Start with your event details, decor direction, and the atmosphere you want the room to carry.",
  },
  {
    title: "Consultation",
    description:
      "We review the celebration, venue context, priorities, and visual references together.",
  },
  {
    title: "Quote + Contract",
    description:
      "You receive a clear proposal and contract once the scope and styling path are aligned.",
  },
  {
    title: "Secure Your Date",
    description:
      "Your date is reserved once the agreement and required payment steps are completed.",
  },
  {
    title: "Event Day",
    description:
      "We handle setup and styling so the room feels polished, intentional, and ready for guests.",
  },
] as const;

export const seoLandingPages: Record<string, SeoLandingConfig> = {
  "wedding-decor-atlanta": {
    slug: "wedding-decor-atlanta",
    title: "Luxury Wedding Decor in Atlanta",
    metaTitle: "Luxury Wedding Decor in Atlanta | Elel Events & Design",
    metaDescription:
      "Luxury wedding decor in Atlanta with refined room styling, floral-focused focal moments, and a polished planning process from consultation to event day.",
    heroTitle: "Luxury Wedding Decor in Atlanta",
    heroDescription:
      "Elel Events & Design creates wedding environments that feel timeless, elevated, and emotionally resonant, with thoughtful styling from ceremony focal points to the final reception reveal.",
    trustLine: "Elegant event styling for meaningful celebrations in Atlanta.",
    intro:
      "For couples who want the room to feel cohesive from the first impression to the last photograph, our wedding decor service focuses on visual rhythm, calm execution, and a design story that feels considered in every detail.",
    benefits: [
      {
        title: "Refined visual direction",
        description:
          "Every wedding design begins with the room mood, focal hierarchy, and guest experience rather than disconnected decor pieces.",
      },
      {
        title: "Custom styling decisions",
        description:
          "We shape the tables, backdrops, florals, candles, and statement moments around your venue and the scale of the celebration.",
      },
      {
        title: "A clear planning process",
        description:
          "You move through consultation, quote, contract, and booking with a structure that keeps the design process easy to follow.",
      },
      {
        title: "Professional event-day execution",
        description:
          "Setup is handled with the same attention to polish as the design itself, so the room is ready for guests and photography.",
      },
    ],
    galleryImages: [
      {
        src: "/images/seo/wedding-decor-atlanta-1.jpg",
        alt: "Luxury wedding reception decor in Atlanta with layered florals and candlelight",
        label: "Reception reveal",
      },
      {
        src: "/images/seo/wedding-decor-atlanta-2.jpg",
        alt: "Atlanta wedding head table design with elegant floral styling",
        label: "Head table",
      },
      {
        src: "/images/seo/wedding-decor-atlanta-3.jpg",
        alt: "Wedding ceremony decor in Atlanta with refined backdrop styling",
        label: "Ceremony focal point",
      },
      {
        src: "/images/seo/wedding-decor-atlanta-4.jpg",
        alt: "Luxury guest table styling for an Atlanta wedding reception",
        label: "Guest tables",
      },
    ],
    serviceDetails: [
      {
        title: "A full wedding design experience",
        body:
          "Our wedding decor work is built around the complete room experience: entrance impression, ceremony or focal wall, sweetheart or head table, guest tables, florals, candles, signage, and the details that make the room feel finished rather than pieced together.",
      },
      {
        title: "Design that fits the venue",
        body:
          "Atlanta weddings vary widely in venue style, from ballrooms and hotel spaces to private estates and cultural halls. We tailor the decor approach so the design feels intentional within the architecture, lighting, and scale of your event space.",
      },
      {
        title: "Styling that photographs beautifully",
        body:
          "We consider how floral density, linens, textures, and focal moments will read both in person and on camera, so the design supports the visual memory of the day as much as the guest experience in the room.",
      },
    ],
    faqs: [
      {
        question: "Do you serve only Atlanta weddings?",
        answer:
          "Atlanta is our core service market, but we also support celebrations in surrounding areas when the date, venue, and event scope are a fit.",
      },
      {
        question: "Can I customize the decor style?",
        answer:
          "Yes. Every wedding design is tailored through consultation so the final styling reflects the room mood, cultural details, and priorities that matter to you.",
      },
      {
        question: "Do you provide setup and breakdown?",
        answer:
          "Setup is part of the service flow. Breakdown needs can also be discussed during planning so the operational side matches the design scope.",
      },
      {
        question: "How early should I book wedding decor in Atlanta?",
        answer:
          "Earlier is better, especially for prime weekends and high-demand seasons. Booking early gives more flexibility for consultation, design refinement, and scheduling.",
      },
      {
        question: "Can you recreate a design from your portfolio?",
        answer:
          "We can use portfolio references as a starting point, but each event is adapted to your venue, event size, and design priorities rather than copied exactly.",
      },
      {
        question: "Do you handle both ceremony and reception styling?",
        answer:
          "Yes, depending on scope. Many clients request design support across both the ceremony focal moments and the reception room experience.",
      },
    ],
    relatedLinks: [
      {
        href: "/gallery",
        label: "View Portfolio",
        description: "Browse real event styling for tables, backdrops, and full room reveals.",
      },
      {
        href: "/services",
        label: "Explore Services",
        description: "See how our decor support is structured for weddings and milestone events.",
      },
      {
        href: "/request",
        label: "Check Availability",
        description: "Start the consultation process for your wedding date and venue.",
      },
      {
        href: "/contact",
        label: "Contact Us",
        description: "Reach out if you need help before submitting your request.",
      },
    ],
    schemaServiceName: "Luxury Wedding Decor in Atlanta",
    serviceLocation: "Atlanta, Georgia",
  },
  "wedding-backdrop-rental-atlanta": {
    slug: "wedding-backdrop-rental-atlanta",
    title: "Wedding Backdrop Rental in Atlanta",
    metaTitle: "Wedding Backdrop Rental in Atlanta | Elel Events & Design",
    metaDescription:
      "Wedding backdrop rental in Atlanta with polished ceremony focal points, reception stage styling, and refined decor direction for elegant celebrations.",
    heroTitle: "Wedding Backdrop Rental in Atlanta",
    heroDescription:
      "From ceremony arches to reception focal walls, we design backdrop moments that feel balanced, elevated, and photo-ready from every angle.",
    trustLine: "Elegant backdrop styling for weddings and meaningful celebrations in Atlanta.",
    intro:
      "A backdrop should do more than fill space. It should establish the visual tone of the room, anchor the photography moments, and create a polished focal point that supports the rest of the design.",
    benefits: [
      {
        title: "Statement focal points",
        description:
          "We create backdrop moments that feel intentional in the room and visually strong in guest photos.",
      },
      {
        title: "Styled beyond the wall",
        description:
          "Backdrop design can include florals, draping, candles, plinths, signage, and surrounding details so the moment feels complete.",
      },
      {
        title: "Venue-aware execution",
        description:
          "Backdrop sizing and styling are adapted to the proportions, ceiling height, and circulation of the event space.",
      },
      {
        title: "Professional setup",
        description:
          "The build and installation side is handled with care so the visual result feels polished and secure on event day.",
      },
    ],
    galleryImages: [
      {
        src: "/images/seo/wedding-backdrop-rental-atlanta-1.jpg",
        alt: "Wedding backdrop rental setup in Atlanta with elegant floral framing",
        label: "Ceremony backdrop",
      },
      {
        src: "/images/seo/wedding-backdrop-rental-atlanta-2.jpg",
        alt: "Reception stage backdrop design for an Atlanta wedding",
        label: "Reception focal wall",
      },
      {
        src: "/images/seo/wedding-backdrop-rental-atlanta-3.jpg",
        alt: "Luxury wedding photo backdrop in Atlanta with soft draping",
        label: "Photo moment",
      },
      {
        src: "/images/seo/wedding-backdrop-rental-atlanta-4.jpg",
        alt: "Atlanta wedding sweetheart backdrop with candlelight details",
        label: "Sweetheart setting",
      },
    ],
    serviceDetails: [
      {
        title: "Backdrop styling for ceremony and reception",
        body:
          "Some events need a ceremony backdrop that frames the exchange beautifully. Others need a reception focal wall behind the sweetheart or head table. We help determine the right approach so the backdrop feels central to the space rather than decorative filler.",
      },
      {
        title: "Designed as part of the room",
        body:
          "A strong backdrop does not stand alone. We consider how it connects with florals, stage pieces, seating, signage, and lighting so the focal point feels naturally integrated into the celebration.",
      },
      {
        title: "Ideal for photo-driven moments",
        body:
          "Backdrops often become the visual anchor for entrances, portraits, speeches, and guest interaction. That means design, scale, and finish matter as much as the base structure itself.",
      },
    ],
    faqs: [
      {
        question: "Do you offer wedding backdrops only in Atlanta?",
        answer:
          "Atlanta is our primary market, but we can support nearby locations depending on logistics, date availability, and event scope.",
      },
      {
        question: "Can the backdrop design be customized?",
        answer:
          "Yes. Backdrop styling is shaped around your venue, event style, and the overall aesthetic direction discussed during consultation.",
      },
      {
        question: "Do you provide setup and removal?",
        answer:
          "Yes, setup is part of making the backdrop feel polished on event day. Removal can also be coordinated as part of the service plan.",
      },
      {
        question: "Can you style a ceremony arch and a reception backdrop together?",
        answer:
          "Yes. If your event requires multiple focal points, we can design them as part of one cohesive decor story.",
      },
      {
        question: "How far in advance should I reserve a backdrop?",
        answer:
          "As early as possible. Prime weekends and wedding-heavy dates tend to book quickly, especially when custom styling is involved.",
      },
      {
        question: "Can you match a backdrop idea I found online?",
        answer:
          "We can work from inspiration references, then refine the final look around your venue and practical setup requirements.",
      },
    ],
    relatedLinks: [
      {
        href: "/gallery",
        label: "View Portfolio",
        description: "See ceremony backdrops, sweetheart settings, and reception focal walls.",
      },
      {
        href: "/services",
        label: "Explore Services",
        description: "Understand how backdrop work fits into the larger event decor process.",
      },
      {
        href: "/request",
        label: "Check Availability",
        description: "Share your date, venue, and backdrop direction to begin planning.",
      },
      {
        href: "/contact",
        label: "Contact Us",
        description: "Ask about logistics, setup, or custom backdrop ideas before booking.",
      },
    ],
    schemaServiceName: "Wedding Backdrop Rental in Atlanta",
    serviceLocation: "Atlanta, Georgia",
  },
  "sweetheart-table-decor-atlanta": {
    slug: "sweetheart-table-decor-atlanta",
    title: "Sweetheart Table Decor in Atlanta",
    metaTitle: "Sweetheart Table Decor in Atlanta | Elel Events & Design",
    metaDescription:
      "Sweetheart table decor in Atlanta with elegant floral styling, layered candles, refined textures, and polished focal design for weddings and receptions.",
    heroTitle: "Sweetheart Table Decor in Atlanta",
    heroDescription:
      "We style sweetheart tables that feel romantic, balanced, and visually central to the room, with florals, candles, linens, and focal detail that elevate the full reception experience.",
    trustLine: "Refined focal table styling for wedding celebrations in Atlanta.",
    intro:
      "The sweetheart table is often one of the most photographed moments of the reception. It should feel distinct without fighting the room, and elevated without looking overstated. Our approach focuses on balance, texture, and strong visual framing.",
    benefits: [
      {
        title: "A true focal table",
        description:
          "We design the sweetheart setup so it holds visual presence in the room while still feeling cohesive with the overall decor story.",
      },
      {
        title: "Layered styling details",
        description:
          "Florals, candles, linens, chargers, draping, and surrounding accents are chosen to make the table feel polished from every angle.",
      },
      {
        title: "Designed for photography",
        description:
          "The layout and backdrop relationship are considered carefully so the table reads beautifully in reception photos and guest views.",
      },
      {
        title: "Integrated with the full decor plan",
        description:
          "We coordinate the sweetheart table with the head table, backdrop, and guest tables so nothing feels disconnected.",
      },
    ],
    galleryImages: [
      {
        src: "/images/seo/sweetheart-table-decor-atlanta-1.jpg",
        alt: "Sweetheart table decor in Atlanta with florals and candlelight",
        label: "Romantic table styling",
      },
      {
        src: "/images/seo/sweetheart-table-decor-atlanta-2.jpg",
        alt: "Atlanta wedding sweetheart table with elegant backdrop design",
        label: "Backdrop framing",
      },
      {
        src: "/images/seo/sweetheart-table-decor-atlanta-3.jpg",
        alt: "Luxury sweetheart table details with layered textures and candles",
        label: "Textural details",
      },
      {
        src: "/images/seo/sweetheart-table-decor-atlanta-4.jpg",
        alt: "Wedding reception focal table setup for a couple in Atlanta",
        label: "Reception focal point",
      },
    ],
    serviceDetails: [
      {
        title: "More than a decorated table",
        body:
          "A sweetheart table works best when it is treated like a full design moment rather than a single furniture piece. We consider the surrounding layout, floral volume, candle placement, linens, and the visual relationship between the couple and the room.",
      },
      {
        title: "A soft but elevated romantic feel",
        body:
          "Many couples want the sweetheart setup to feel intimate and elegant without becoming visually heavy. Our styling decisions focus on softness, proportion, and enough layering to create richness without clutter.",
      },
      {
        title: "Built to support the full reception design",
        body:
          "The sweetheart table should connect naturally with guest tables, stage pieces, signage, and the overall reception palette. That is what makes the room feel expensive and complete rather than assembled in sections.",
      },
    ],
    faqs: [
      {
        question: "Do you serve only Atlanta for sweetheart table decor?",
        answer:
          "Atlanta is our main market, but we can discuss nearby locations depending on the date and overall event logistics.",
      },
      {
        question: "Can the sweetheart table match my wedding palette?",
        answer:
          "Yes. Colors, florals, textures, and styling details are customized to align with the broader design direction of the event.",
      },
      {
        question: "Can you include candles and florals?",
        answer:
          "Yes, depending on venue rules and event scope. Candlelight and floral layering are often key parts of sweetheart table styling.",
      },
      {
        question: "Do you also style the backdrop behind the sweetheart table?",
        answer:
          "Yes. Many sweetheart table designs are strongest when the backdrop and table are designed together as one focal area.",
      },
      {
        question: "How far in advance should I book?",
        answer:
          "The earlier the better, especially for wedding dates in peak seasons. Early booking helps us align design, logistics, and setup timing.",
      },
      {
        question: "Can I send inspiration photos?",
        answer:
          "Yes. Inspiration images are useful during the request and consultation process, and we adapt them to your venue and event priorities.",
      },
    ],
    relatedLinks: [
      {
        href: "/gallery",
        label: "View Portfolio",
        description: "See focal table styling, floral layering, and reception details.",
      },
      {
        href: "/services",
        label: "Explore Services",
        description: "Learn how sweetheart table styling fits into full wedding decor planning.",
      },
      {
        href: "/request",
        label: "Check Availability",
        description: "Share your date and reception vision to begin the consultation process.",
      },
      {
        href: "/contact",
        label: "Contact Us",
        description: "Ask about florals, candles, or custom focal table styling.",
      },
    ],
    schemaServiceName: "Sweetheart Table Decor in Atlanta",
    serviceLocation: "Atlanta, Georgia",
  },
  "engagement-party-decor-atlanta": {
    slug: "engagement-party-decor-atlanta",
    title: "Engagement Party Decor in Atlanta",
    metaTitle: "Engagement Party Decor in Atlanta | Elel Events & Design",
    metaDescription:
      "Engagement party decor in Atlanta with romantic styling, intimate celebration design, elegant backdrops, tablescapes, and guest-ready details.",
    heroTitle: "Engagement Party Decor in Atlanta",
    heroDescription:
      "We style engagement parties that feel intimate, elevated, and emotionally warm, with decor that honors the moment while creating a polished guest experience.",
    trustLine: "Romantic event styling for elegant engagement celebrations in Atlanta.",
    intro:
      "An engagement party should feel celebratory and beautifully considered without losing its intimacy. We focus on the design elements that shape atmosphere quickly: the focal backdrop, the couple moment, the guest tables, and the details guests remember in person and in photos.",
    benefits: [
      {
        title: "Romantic, polished styling",
        description:
          "We create a celebration atmosphere that feels warm, elevated, and appropriate for both intimate and larger engagement events.",
      },
      {
        title: "Flexible design scale",
        description:
          "Whether you need a few signature focal points or fuller event styling, we help define the right level of decor support.",
      },
      {
        title: "Custom event direction",
        description:
          "Every engagement party is shaped around the venue, guest experience, and visual tone you want the event to carry.",
      },
      {
        title: "A streamlined process",
        description:
          "You get a clear consultation and booking path so the decor planning feels simple instead of overwhelming.",
      },
    ],
    galleryImages: [
      {
        src: "/images/seo/engagement-party-decor-atlanta-1.jpg",
        alt: "Engagement party decor in Atlanta with romantic floral focal styling",
        label: "Romantic setup",
      },
      {
        src: "/images/seo/engagement-party-decor-atlanta-2.jpg",
        alt: "Atlanta engagement celebration backdrop and welcome area decor",
        label: "Welcome moment",
      },
      {
        src: "/images/seo/engagement-party-decor-atlanta-3.jpg",
        alt: "Elegant engagement party tablescape styling in Atlanta",
        label: "Tablescape",
      },
      {
        src: "/images/seo/engagement-party-decor-atlanta-4.jpg",
        alt: "Couple focal area decor for an engagement party in Atlanta",
        label: "Couple focal point",
      },
    ],
    serviceDetails: [
      {
        title: "Decor that feels celebratory without excess",
        body:
          "Engagement parties often need a softer scale than weddings, but they still deserve strong visual direction. We focus on the key styling moments that make the event feel special, welcoming, and clearly designed.",
      },
      {
        title: "Ideal for intimate gatherings and elegant dinners",
        body:
          "Whether your engagement celebration is a private dinner, a family gathering, or a larger reception-style event, we tailor the decor approach to the size and energy of the occasion.",
      },
      {
        title: "Designed for memory-making moments",
        body:
          "The entrance, the photo moment, the couple area, and the table styling all contribute to how the event is remembered. We help make those moments feel warm and elevated.",
      },
    ],
    faqs: [
      {
        question: "Do you serve only Atlanta engagement parties?",
        answer:
          "Atlanta is our primary service market, but nearby areas may also be available depending on schedule and event scope.",
      },
      {
        question: "Can the decor be customized to my event theme?",
        answer:
          "Yes. We tailor the styling around your venue, color palette, and the feeling you want the celebration to carry.",
      },
      {
        question: "Do you provide setup and breakdown?",
        answer:
          "Setup is part of the planning process, and breakdown coordination can also be discussed depending on event needs.",
      },
      {
        question: "Can you style just a backdrop and welcome area?",
        answer:
          "Yes. Some engagement parties only need a few focal moments, while others need broader room styling. We can define the right scope during consultation.",
      },
      {
        question: "How early should I book decor for an engagement party?",
        answer:
          "Booking early gives more room for consultation and date availability, especially during busy event seasons.",
      },
      {
        question: "Can I reference your portfolio when planning my event?",
        answer:
          "Yes. Portfolio references are helpful for clarifying room mood, floral density, and the overall direction you want.",
      },
    ],
    relatedLinks: [
      {
        href: "/gallery",
        label: "View Portfolio",
        description: "See romantic setups, backdrops, and polished celebration styling.",
      },
      {
        href: "/services",
        label: "Explore Services",
        description: "Review the service directions available for milestone events and weddings.",
      },
      {
        href: "/request",
        label: "Check Availability",
        description: "Start the planning process for your engagement celebration date.",
      },
      {
        href: "/contact",
        label: "Contact Us",
        description: "Get in touch before booking if you want help defining event scope.",
      },
    ],
    schemaServiceName: "Engagement Party Decor in Atlanta",
    serviceLocation: "Atlanta, Georgia",
  },
  "baby-shower-decoration-atlanta": {
    slug: "baby-shower-decoration-atlanta",
    title: "Baby Shower Decoration in Atlanta",
    metaTitle: "Baby Shower Decoration in Atlanta | Elel Events & Design",
    metaDescription:
      "Baby shower decoration in Atlanta with soft luxury styling, custom themes, elegant welcome signage, focal backdrops, and polished guest-table details.",
    heroTitle: "Baby Shower Decoration in Atlanta",
    heroDescription:
      "We design baby shower celebrations with softness, polish, and thoughtful detail, creating rooms that feel warm, custom, and beautifully prepared for guests.",
    trustLine: "Soft luxury styling for baby showers and family celebrations in Atlanta.",
    intro:
      "A baby shower can feel gentle and elevated at the same time. Our design approach balances softness with strong visual structure so the event feels inviting, intentional, and memorable for family and guests.",
    benefits: [
      {
        title: "Soft luxury aesthetic",
        description:
          "We create baby shower decor that feels refined and warm, with a palette and styling level that suits the event beautifully.",
      },
      {
        title: "Custom theme support",
        description:
          "From welcome signage to focal tables and florals, the design is shaped around your preferred theme and room mood.",
      },
      {
        title: "Clean, polished setups",
        description:
          "We focus on the details that keep the celebration visually composed rather than crowded or theme-heavy.",
      },
      {
        title: "Guest-ready event flow",
        description:
          "Backdrops, signage, table styling, and focal areas are arranged so the event feels complete and easy for guests to enjoy.",
      },
    ],
    galleryImages: [
      {
        src: "/images/seo/baby-shower-decoration-atlanta-1.jpg",
        alt: "Baby shower decoration in Atlanta with soft luxury styling and florals",
        label: "Soft luxury styling",
      },
      {
        src: "/images/seo/baby-shower-decoration-atlanta-2.jpg",
        alt: "Atlanta baby shower welcome sign and backdrop decor",
        label: "Welcome area",
      },
      {
        src: "/images/seo/baby-shower-decoration-atlanta-3.jpg",
        alt: "Elegant baby shower guest table styling in Atlanta",
        label: "Guest tables",
      },
      {
        src: "/images/seo/baby-shower-decoration-atlanta-4.jpg",
        alt: "Custom baby shower focal table and dessert styling in Atlanta",
        label: "Focal table",
      },
    ],
    serviceDetails: [
      {
        title: "Designed around softness and refinement",
        body:
          "Baby shower decor should feel warm and celebratory without becoming visually busy. We focus on backdrop styling, signage, focal moments, florals, and table details that create a calm, elevated atmosphere.",
      },
      {
        title: "Ideal for custom family celebrations",
        body:
          "Some showers call for a very soft and classic design direction, while others need a theme-driven approach with more playful details. We shape the decor so it still feels polished and elegant.",
      },
      {
        title: "Beautiful for guests and photos",
        body:
          "Welcome moments, focal walls, sweetheart or guest-of-honor areas, and table styling are planned so the room feels memorable in person and photographs cleanly throughout the event.",
      },
    ],
    faqs: [
      {
        question: "Do you serve only Atlanta baby showers?",
        answer:
          "Atlanta is our primary service market, with nearby locations available depending on date and event scope.",
      },
      {
        question: "Can the baby shower decor be customized?",
        answer:
          "Yes. We tailor the styling around your preferred palette, theme direction, venue, and the kind of guest atmosphere you want.",
      },
      {
        question: "Do you provide welcome signs and focal pieces?",
        answer:
          "Yes, those are common parts of baby shower styling and can be included depending on the event scope.",
      },
      {
        question: "Can you style a baby shower at home or in a small venue?",
        answer:
          "Yes. We can adapt the decor plan to private homes, event spaces, restaurants, or other intimate celebration venues.",
      },
      {
        question: "How early should I book baby shower decor?",
        answer:
          "Booking early gives more flexibility for consultation, design refinement, and reserving your preferred date.",
      },
      {
        question: "Can I send inspiration photos before booking?",
        answer:
          "Yes. Inspiration references help us understand the room mood and design priorities before consultation.",
      },
    ],
    relatedLinks: [
      {
        href: "/gallery",
        label: "View Portfolio",
        description: "See polished focal moments, signage, and celebration styling inspiration.",
      },
      {
        href: "/services",
        label: "Explore Services",
        description: "Learn how our decor support works for baby showers and milestone events.",
      },
      {
        href: "/request",
        label: "Check Availability",
        description: "Share your date, location, and baby shower design direction.",
      },
      {
        href: "/contact",
        label: "Contact Us",
        description: "Reach out if you need help defining the right baby shower decor scope.",
      },
    ],
    schemaServiceName: "Baby Shower Decoration in Atlanta",
    serviceLocation: "Atlanta, Georgia",
  },
};

export function getSeoLandingPage(slug: string) {
  const config = seoLandingPages[slug];

  if (!config) {
    throw new Error(`Unknown SEO landing page slug: ${slug}`);
  }

  return config;
}

export function buildSeoLandingMetadata(config: SeoLandingConfig): Metadata {
  const canonical = `${siteUrl}/${config.slug}`;
  const ogImage = `${siteUrl}${config.galleryImages[0]?.src ?? "/logo.png"}`;

  return {
    title: config.metaTitle,
    description: config.metaDescription,
    alternates: {
      canonical,
    },
    openGraph: {
      title: config.metaTitle,
      description: config.metaDescription,
      url: canonical,
      siteName: businessName,
      type: "website",
      images: [
        {
          url: ogImage,
          alt: config.galleryImages[0]?.alt ?? config.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: config.metaTitle,
      description: config.metaDescription,
      images: [ogImage],
    },
  };
}

export function buildSeoLandingSchema(config: SeoLandingConfig) {
  const pageUrl = `${siteUrl}/${config.slug}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: siteUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: config.title,
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "LocalBusiness",
        "@id": `${siteUrl}#business`,
        name: businessName,
        url: siteUrl,
        image: `${siteUrl}/logo.png`,
        areaServed: config.serviceLocation,
        telephone: "+1-000-000-0000",
        priceRange: "$$",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Atlanta",
          addressRegion: "GA",
          addressCountry: "US",
        },
      },
      {
        "@type": "Service",
        serviceType: config.schemaServiceName,
        name: config.schemaServiceName,
        description: config.metaDescription,
        provider: {
          "@id": `${siteUrl}#business`,
        },
        areaServed: {
          "@type": "City",
          name: "Atlanta",
        },
        url: pageUrl,
      },
      {
        "@type": "FAQPage",
        mainEntity: config.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };
}
