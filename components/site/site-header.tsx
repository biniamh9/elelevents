"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Button from "@/components/ui/button";

const links = [
  { href: "/", label: "Home" },
  { href: "/gallery", label: "Portfolio" },
  { href: "/services", label: "Services" },
  { href: "/#process", label: "How It Works" },
  { href: "/about#reviews", label: "Reviews" },
  { href: "/contact", label: "Contact" },
];

const hiddenPrefixes = ["/admin", "/vendors/dashboard", "/vendors/pending"];

function isCurrentPath(pathname: string, href: string) {
  const pathOnly = href.split("#")[0] || "/";

  if (pathOnly === "/") {
    return pathname === "/";
  }

  return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeHomeSection, setActiveHomeSection] = useState("home");
  const [showFloatingCta, setShowFloatingCta] = useState(false);
  const [dismissedFloatingCta, setDismissedFloatingCta] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [showMobileBookingBar, setShowMobileBookingBar] = useState(false);
  const [mobileBookingExpanded, setMobileBookingExpanded] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  useEffect(() => {
    setOpen(false);
    setMobileBookingExpanded(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      setMobileBookingExpanded(false);
    }
  }, [open]);

  useEffect(() => {
    const updateViewport = () => {
      setIsMobileViewport(window.innerWidth <= 900);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport, { passive: true });

    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (!isMobileViewport) {
      setOpen(false);
    }
  }, [isMobileViewport]);

  useEffect(() => {
    if (pathname !== "/") {
      setScrolled(window.scrollY > 24);
      setShowFloatingCta(false);
      setDismissedFloatingCta(false);
      return;
    }

    const hero = document.querySelector<HTMLElement>(".hero-stage--simple");

    const updateScroll = () => {
      setScrolled(window.scrollY > 18);

      const heroHeight = hero?.offsetHeight ?? window.innerHeight;
      const showThreshold = heroHeight * 0.3;
      const reappearThreshold = heroHeight * 0.9;

      if (dismissedFloatingCta && window.scrollY < reappearThreshold) {
        setShowFloatingCta(false);
        return;
      }

      if (window.scrollY >= showThreshold) {
        setShowFloatingCta(true);
        if (window.scrollY >= reappearThreshold) {
          setDismissedFloatingCta(false);
        }
      } else {
        setShowFloatingCta(false);
      }
    };

    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });

    return () => window.removeEventListener("scroll", updateScroll);
  }, [dismissedFloatingCta, pathname]);

  useEffect(() => {
    const footer = document.querySelector(".site-footer");

    if (!footer) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setFooterVisible(entries.some((entry) => entry.isIntersecting));
      },
      {
        rootMargin: "0px 0px -24px 0px",
        threshold: 0.05,
      }
    );

    observer.observe(footer);

    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;

      if (!target) {
        return;
      }

      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable) {
        setInputFocused(true);
        setMobileBookingExpanded(false);
      }
    };

    const onFocusOut = () => {
      window.setTimeout(() => {
        const active = document.activeElement as HTMLElement | null;
        const stillFocused =
          active &&
          (["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName) || active.isContentEditable);

        setInputFocused(Boolean(stillFocused));
      }, 0);
    };

    window.addEventListener("focusin", onFocusIn);
    window.addEventListener("focusout", onFocusOut);

    return () => {
      window.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  useEffect(() => {
    if (!isMobileViewport) {
      setShowMobileBookingBar(false);
      setMobileBookingExpanded(false);
      return;
    }

    let lastY = window.scrollY;

    const updateScrollState = () => {
      const currentY = window.scrollY;
      const scrollable = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      const progress = currentY / scrollable;
      const delta = currentY - lastY;

      setScrolled(currentY > 18);

      if (open || inputFocused || footerVisible || progress < 0.2) {
        setShowMobileBookingBar(false);
      } else if (delta < -18) {
        setShowMobileBookingBar(false);
      } else if (delta > 6 || progress > 0.2) {
        setShowMobileBookingBar(true);
      }

      lastY = currentY;
    };

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });

    return () => window.removeEventListener("scroll", updateScrollState);
  }, [footerVisible, inputFocused, isMobileViewport, open, pathname]);

  useEffect(() => {
    if (pathname !== "/") {
      return;
    }

    const sections = [
      { id: "home", element: document.querySelector(".hero-stage--simple") },
      { id: "process", element: document.getElementById("process") },
    ].filter((item) => item.element) as Array<{ id: string; element: Element }>;

    if (!sections.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) {
          return;
        }

        const match = sections.find((section) => section.element === visible.target);

        if (match) {
          setActiveHomeSection(match.id);
        }
      },
      {
        rootMargin: "-24% 0px -48% 0px",
        threshold: [0.2, 0.45, 0.7],
      }
    );

    sections.forEach((section) => observer.observe(section.element));

    return () => observer.disconnect();
  }, [pathname]);

  if (hiddenPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  const isHome = pathname === "/";

  const isLinkActive = (href: string) => {
    if (href === "/#process") {
      return pathname === "/" && activeHomeSection === "process";
    }

    if (href === "/") {
      return pathname === "/" && activeHomeSection === "home";
    }

    return isCurrentPath(pathname, href);
  };

  return (
    <header
      className={`site-header${isHome ? " is-home" : ""}${scrolled ? " is-scrolled" : ""}${open ? " menu-open" : ""}`}
    >
      <div className="container nav-shell">
        <div className="nav">
          <Link href="/" className="brand brand-logo" aria-label="Elel Events home">
            <Image
              src="/logo.png"
              alt="Elel Events logo"
              width={320}
              height={120}
              priority
              className="brand-logo-image"
            />
            <span className="brand-logo-copy">
              <strong>Elel Events</strong>
              <small>Luxury Event Design</small>
            </span>
          </Link>

          <nav
            id="site-nav"
            className="nav-links nav-links--desktop"
            aria-label="Primary navigation"
          >
            {links.map((link) => {
              const isActive = isLinkActive(link.href);

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
          </nav>

          <div className="nav-main">
            <Button href="/gallery" variant="secondary" className="nav-ghost-cta">View Gallery</Button>
            <Button href="/request" className="nav-cta">Book Consultation</Button>
          </div>

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
        </div>
      </div>

      <div
        className={`nav-drawer-backdrop${open ? " is-open" : ""}`}
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />

      <div className={`nav-mobile-overlay${open ? " is-open" : ""}`} aria-hidden={!open}>
        <div className="nav-mobile-head">
          <button
            type="button"
            className="nav-mobile-close"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            ×
          </button>
          <div className="nav-mobile-brand">
            <Image
              src="/logo.png"
              alt="Elel Events logo"
              width={320}
              height={120}
              className="nav-mobile-brand-image"
            />
            <strong>Elel Events &amp; Design</strong>
            <span>Luxury Event Design in Atlanta</span>
            <small>Transforming dream celebrations into unforgettable moments</small>
          </div>
        </div>

        <div className="nav-mobile-links">
          {links.map((link) => {
            const isActive = isLinkActive(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={isActive ? "is-active" : undefined}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="nav-mobile-booking">
          <small>Dates fill quickly for weddings &amp; special events</small>
          <div className="nav-mobile-booking-actions">
            <Button href="/request" className="nav-mobile-booking-primary">Check Availability</Button>
            <Button href="/request" variant="secondary" className="nav-mobile-booking-secondary">Book Consultation</Button>
          </div>
          <div className="nav-mobile-trust">
            <span>★★★★★ Google Reviews</span>
            <span>Serving Atlanta since 2019</span>
            <span>12+ years of luxury decor</span>
          </div>
        </div>
      </div>

      {isHome ? (
        <aside className={`floating-booking-cta${showFloatingCta ? " is-visible" : ""}`}>
          <button
            type="button"
            className="floating-booking-cta-close"
            aria-label="Dismiss booking prompt"
            onClick={() => {
              setShowFloatingCta(false);
              setDismissedFloatingCta(true);
            }}
          >
            ×
          </button>
          <small>Ready to secure your date?</small>
          <strong>Check Availability</strong>
          <span>Atlanta brides book fast</span>
          <Button href="/request" className="floating-booking-cta-button">Check Availability</Button>
        </aside>
      ) : null}

      <aside
        className={`mobile-booking-bar${showMobileBookingBar && !open && !footerVisible && !inputFocused ? " is-visible" : ""}${mobileBookingExpanded ? " is-expanded" : ""}`}
      >
        <button
          type="button"
          className="mobile-booking-bar-trigger"
          aria-expanded={mobileBookingExpanded}
          onClick={() => setMobileBookingExpanded((value) => !value)}
        >
          <div className="mobile-booking-bar-copy">
            <strong>Ready for your dream setup?</strong>
            <span>Fast availability check</span>
          </div>
          <span className="mobile-booking-bar-action">Check Date</span>
        </button>

        <div className="mobile-booking-bar-panel">
          <button
            type="button"
            className="mobile-booking-bar-close"
            aria-label="Minimize booking panel"
            onClick={() => setMobileBookingExpanded(false)}
          >
            ×
          </button>
          <small>Let&apos;s secure your event date</small>
          <div className="mobile-booking-bar-actions">
            <Button href="/request" className="mobile-booking-bar-primary">Check Availability</Button>
            <Button href="/request" variant="secondary" className="mobile-booking-bar-secondary">Book Consultation</Button>
          </div>
          <span className="mobile-booking-bar-trust">Atlanta brides book weeks ahead</span>
        </div>
      </aside>
    </header>
  );
}
