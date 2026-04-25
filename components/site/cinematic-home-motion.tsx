"use client";

import { useEffect } from "react";

export default function CinematicHomeMotion() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealElements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]")
    );

    const heroMedia = document.querySelector<HTMLElement>(".cinematic-hero__media");
    const isMobile = window.innerWidth <= 780;

    const applyParallax = () => {
      if (!heroMedia) return;

      if (prefersReducedMotion) {
        heroMedia.style.setProperty("--hero-parallax", "0px");
        return;
      }

      const scrollY = window.scrollY;
      const maxShift = isMobile ? 18 : 40;
      const offset = Math.min(scrollY * 0.18, maxShift);
      heroMedia.style.setProperty("--hero-parallax", `${offset.toFixed(2)}px`);
    };

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(applyParallax);
    };

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -12% 0px",
      }
    );

    revealElements.forEach((element) => {
      if (prefersReducedMotion) {
        element.classList.add("is-visible");
        return;
      }
      revealObserver.observe(element);
    });

    applyParallax();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      revealObserver.disconnect();
    };
  }, []);

  return null;
}
