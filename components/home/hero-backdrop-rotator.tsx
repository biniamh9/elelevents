"use client";

import { useEffect, useState } from "react";

export default function HeroBackdropRotator({
  images,
}: {
  images: string[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, 4200);

    return () => window.clearInterval(interval);
  }, [images]);

  return (
    <div className="hero-backdrop" aria-hidden="true">
      {images.map((image, index) => (
        <div
          key={`${image}-${index}`}
          className={`hero-backdrop-frame ${
            index === activeIndex ? "is-active" : ""
          }`}
          style={{ backgroundImage: `url(${image})` }}
        />
      ))}
      <div className="hero-backdrop-tint" />
    </div>
  );
}
