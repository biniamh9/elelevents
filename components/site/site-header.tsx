"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Portfolio" },
  { href: "/packages", label: "Packages" },
  { href: "/contact", label: "Contact" },
];

const hiddenPrefixes = ["/admin"];

function isCurrentPath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const updateScroll = () => {
      setScrolled(window.scrollY > 24);
    };

    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });

    return () => window.removeEventListener("scroll", updateScroll);
  }, []);

  if (hiddenPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  const isHome = pathname === "/";

  return (
    <header
      className={`site-header${isHome ? " is-home" : ""}${scrolled ? " is-scrolled" : ""}`}
    >
      <div className="container nav">
        <Link href="/" className="brand brand-logo" aria-label="Elel Events home">
          <Image
            src="/logo.png"
            alt="Elel Events logo"
            width={320}
            height={120}
            priority
            className="brand-logo-image"
          />
        </Link>

        <div className="nav-main">
          <button
            type="button"
            className={`nav-toggle${open ? " is-open" : ""}`}
            aria-expanded={open}
            aria-controls="site-nav"
            aria-label="Toggle menu"
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
            <span />
          </button>

          <nav
            id="site-nav"
            className={`nav-links${open ? " is-open" : ""}`}
            aria-label="Primary navigation"
          >
            {links.map((link) => {
              const isActive = isCurrentPath(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={isActive ? "is-active" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}

            <Link href="/request" className="btn nav-cta nav-cta--mobile">
              Book Consultation
            </Link>
          </nav>

          <Link href="/request" className="btn nav-cta nav-cta--desktop">
            Book Consultation
          </Link>
        </div>
      </div>
    </header>
  );
}
