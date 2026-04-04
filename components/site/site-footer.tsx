"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const hiddenPrefixes = ["/admin", "/vendors/dashboard", "/vendors/pending"];

type SocialLinksResponse = {
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
};

export default function SiteFooter() {
  const pathname = usePathname();
  const [socialLinks, setSocialLinks] = useState<SocialLinksResponse>({});

  useEffect(() => {
    let cancelled = false;

    async function loadSocialLinks() {
      try {
        const res = await fetch("/api/social-links", { cache: "no-store" });
        if (!res.ok) {
          return;
        }

        const data = (await res.json()) as SocialLinksResponse;
        if (!cancelled) {
          setSocialLinks(data);
        }
      } catch {
        // Keep footer usable without blocking render.
      }
    }

    loadSocialLinks();

    return () => {
      cancelled = true;
    };
  }, []);

  if (hiddenPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  const availableSocialLinks = [
    {
      key: "instagram",
      label: "Instagram",
      href: socialLinks.instagramUrl,
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      key: "facebook",
      label: "Facebook",
      href: socialLinks.facebookUrl,
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M13.5 20v-6h2.4l.6-3h-3V9.4c0-.9.3-1.6 1.6-1.6H16V5.1c-.2 0-.9-.1-1.8-.1-2.2 0-3.7 1.3-3.7 3.9V11H8v3h2.5v6h3Z" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      key: "tiktok",
      label: "TikTok",
      href: socialLinks.tiktokUrl,
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14 4c.4 1.6 1.4 2.9 3 3.7 1 .5 2 .7 3 .7v2.8a8 8 0 0 1-3.4-.8v5.3a5.8 5.8 0 1 1-5.1-5.8v3c-1.4 0-2.5 1.1-2.5 2.6s1.1 2.6 2.5 2.6c1.5 0 2.5-1.1 2.5-2.6V4H14Z" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
  ].filter((item) => item.href);

  return (
    <footer className="site-footer">
      <div className="footer container">
        <p>© 2026 Elel Events. Elegant design for meaningful celebrations.</p>
        <div className="site-footer-links-wrap">
          {availableSocialLinks.length ? (
            <div className="site-footer-social" aria-label="Social media">
              {availableSocialLinks.map((item) => (
                <a
                  key={item.key}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="site-footer-social-link"
                  aria-label={item.label}
                >
                  {item.icon}
                </a>
              ))}
            </div>
          ) : null}

          <div className="site-footer-links" aria-label="Footer links">
            <Link href="/contact">Contact</Link>
            <Link href="/vendors">Vendor Support</Link>
            <Link href="/admin/login" className="site-footer-admin-link">
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
