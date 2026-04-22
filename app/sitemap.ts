import type { MetadataRoute } from "next";

import { getSeoLandingPageEntries } from "@/lib/seo-landing-pages";

const siteUrl = "https://elelevents.com";

const staticRoutes = [
  "",
  "/about",
  "/contact",
  "/gallery",
  "/packages",
  "/request",
  "/rentals",
  "/services",
  "/vendors",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/services" || route === "/gallery" || route === "/request" ? 0.9 : 0.7,
  }));

  const seoEntries: MetadataRoute.Sitemap = getSeoLandingPageEntries().map((page) => ({
    url: `${siteUrl}/${page.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticEntries, ...seoEntries];
}
