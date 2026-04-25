"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { GalleryItem } from "@/lib/gallery";

export default function GalleryBrowser({
  items,
}: {
  items: GalleryItem[];
}) {
  function normalizeCategory(value: string | null | undefined, fallback: string) {
    if (!value) {
      return fallback;
    }

    const cleaned = value
      .replace(/[_-]+/g, " ")
      .replace(/\bbride shower\b/gi, "Bridal Shower")
      .replace(/\bmelsi\b/gi, "Traditional Melsi")
      .replace(/\bwedding\b/gi, "Wedding Reception")
      .replace(/\bbabyshower\b/gi, "Baby Shower")
      .replace(/\s+/g, " ")
      .trim();

    return cleaned
      .split(" ")
      .map((part) =>
        part.length <= 3 && part === part.toUpperCase()
          ? part
          : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      )
      .join(" ");
  }

  function normalizeTitle(value: string | null | undefined, fallback: string) {
    if (!value) {
      return fallback;
    }

    const cleaned = value
      .replace(/[_-]+/g, " ")
      .replace(/\bbride shower\b/gi, "Bridal Shower")
      .replace(/\bmelsi\b/gi, "Traditional Melsi")
      .replace(/\s+/g, " ")
      .trim();

    return cleaned
      .split(" ")
      .map((part) =>
        part.length <= 3 && part === part.toUpperCase()
          ? part
          : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      )
      .join(" ");
  }

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(items.map((item) => normalizeCategory(item.category, "")).filter(Boolean))
    ) as string[];

    return ["All", ...unique];
  }, [items]);

  const [activeCategory, setActiveCategory] = useState("All");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const filteredItems = useMemo(() => {
    if (activeCategory === "All") {
      return items;
    }

    return items.filter((item) => normalizeCategory(item.category, "") === activeCategory);
  }, [activeCategory, items]);

  const activeItem =
    activeIndex !== null && filteredItems[activeIndex]
      ? filteredItems[activeIndex]
      : null;

  function closeLightbox() {
    setActiveIndex(null);
  }

  function showPrevious() {
    setActiveIndex((current) => {
      if (current === null || filteredItems.length === 0) {
        return current;
      }

      return current === 0 ? filteredItems.length - 1 : current - 1;
    });
  }

  function showNext() {
    setActiveIndex((current) => {
      if (current === null || filteredItems.length === 0) {
        return current;
      }

      return current === filteredItems.length - 1 ? 0 : current + 1;
    });
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (activeIndex === null) {
        return;
      }

      if (event.key === "Escape") {
        closeLightbox();
      }

      if (event.key === "ArrowLeft") {
        showPrevious();
      }

      if (event.key === "ArrowRight") {
        showNext();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, filteredItems.length]);

  useEffect(() => {
    setActiveIndex(null);
  }, [activeCategory]);

  useEffect(() => {
    if (activeIndex === null) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeIndex]);

  return (
    <>
      <section className="gallery-browser-shell" data-reveal>
        <div className="gallery-toolbar" data-reveal-child style={{ ["--reveal-delay" as string]: "0ms" }}>
          <div className="option-pills">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`pill ${activeCategory === category ? "selected" : ""}`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <p className="muted">
            {filteredItems.length} {filteredItems.length === 1 ? "image" : "images"}
          </p>
        </div>

        <div className="gallery-grid">
          {filteredItems.map((item, index) => (
            <article
              key={item.id}
              className="gallery-item gallery-item-button"
              data-reveal-child
              style={{ ["--reveal-delay" as string]: `${80 + (index % 6) * 70}ms` }}
            >
              <button
                type="button"
                className="gallery-item-media"
                onClick={() => setActiveIndex(index)}
                aria-label={`Open ${normalizeTitle(item.title, "Portfolio image")} full screen`}
              >
                <img src={item.image_url} alt={normalizeTitle(item.title, "Portfolio image")} />
                <div className="gallery-item-overlay" />
                <div className="gallery-item-cta">Open full screen</div>
              </button>
              <div className="meta">
                <div className="gallery-item-copy">
                  <strong>{normalizeTitle(item.title, "Portfolio image")}</strong>
                  <div className="muted">{normalizeCategory(item.category, "Portfolio")}</div>
                </div>
                <Link href={`/gallery/${item.id}`} className="gallery-item-link">
                  View Experience
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {activeItem ? (
        <div
          className="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={normalizeTitle(activeItem.title, "Portfolio image")}
          onClick={closeLightbox}
        >
          <button
            type="button"
            className="gallery-lightbox-close"
            onClick={closeLightbox}
            aria-label="Close image viewer"
          >
            Close
          </button>

          <button
            type="button"
            className="gallery-lightbox-nav gallery-lightbox-nav--prev"
            onClick={(event) => {
              event.stopPropagation();
              showPrevious();
            }}
            aria-label="Previous image"
          >
            ‹
          </button>

          <div
            className="gallery-lightbox-stage"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="gallery-lightbox-stage-frame">
            <img src={activeItem.image_url} alt={normalizeTitle(activeItem.title, "Portfolio image")} />
            </div>
            <div className="gallery-lightbox-meta">
              <div className="gallery-lightbox-copy">
                <strong>{normalizeTitle(activeItem.title, "Portfolio image")}</strong>
                <span>{normalizeCategory(activeItem.category, "Portfolio")}</span>
              </div>
              <small>
                {activeIndex! + 1} / {filteredItems.length}
              </small>
            </div>
          </div>

          <button
            type="button"
            className="gallery-lightbox-nav gallery-lightbox-nav--next"
            onClick={(event) => {
              event.stopPropagation();
              showNext();
            }}
            aria-label="Next image"
          >
            ›
          </button>
        </div>
      ) : null}
    </>
  );
}
