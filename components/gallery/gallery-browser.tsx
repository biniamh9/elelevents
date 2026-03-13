"use client";

import { useEffect, useMemo, useState } from "react";
import type { GalleryItem } from "@/lib/gallery";

export default function GalleryBrowser({
  items,
}: {
  items: GalleryItem[];
}) {
  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(items.map((item) => item.category).filter(Boolean))
    ) as string[];

    return ["All", ...unique];
  }, [items]);

  const [activeCategory, setActiveCategory] = useState("All");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const filteredItems = useMemo(() => {
    if (activeCategory === "All") {
      return items;
    }

    return items.filter((item) => item.category === activeCategory);
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

  return (
    <>
      <div className="gallery-toolbar">
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
          {filteredItems.length} image{filteredItems.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="gallery-grid">
        {filteredItems.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className="gallery-item gallery-item-button"
            onClick={() => setActiveIndex(index)}
          >
            <img src={item.image_url} alt={item.title} />
            <div className="meta">
              <strong>{item.title}</strong>
              <div className="muted">{item.category}</div>
            </div>
          </button>
        ))}
      </div>

      {activeItem ? (
        <div
          className="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={activeItem.title}
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
            <img src={activeItem.image_url} alt={activeItem.title} />
            <div className="gallery-lightbox-meta">
              <strong>{activeItem.title}</strong>
              <span>{activeItem.category ?? "Gallery"}</span>
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
