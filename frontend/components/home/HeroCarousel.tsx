'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const CLOUDFRONT_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL || 'https://dyzz4logwgput.cloudfront.net';

const HERO_IMAGES = [
  `${CLOUDFRONT_URL}/static/hero/hero1.jpg`,
  `${CLOUDFRONT_URL}/static/hero/hero2.jpg`,
  `${CLOUDFRONT_URL}/static/hero/hero3.jpg`,
  `${CLOUDFRONT_URL}/static/hero/hero4.jpg`,
  `${CLOUDFRONT_URL}/static/hero/hero5.jpg`,
  `${CLOUDFRONT_URL}/static/hero/hero6.jpg`,
];

const ROTATE_INTERVAL_MS = 5500;

export function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % HERO_IMAGES.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const nextIndex = (index + 1) % HERO_IMAGES.length;

  return (
    <div className="col-start-1 row-start-1 min-h-[90vh] w-full grid relative">
      <div className="col-start-1 row-start-1 min-h-[90vh] w-full relative">
        {/* All images stacked — only the active one is visible via opacity */}
        {HERO_IMAGES.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{ opacity: i === index ? 1 : 0 }}
          >
            <Image
              src={src}
              alt=""
              fill
              priority={i === 0}
              loading={i === 0 ? 'eager' : 'lazy'}
              className="object-cover"
              sizes="100vw"
            />
          </div>
        ))}
        {/* Preload next image */}
        <link rel="preload" as="image" href={HERO_IMAGES[nextIndex]} />
      </div>
      {/* Dark overlay for legibility */}
      <div
        className="col-start-1 row-start-1 min-h-[90vh] w-full absolute inset-0 bg-black/60 pointer-events-none"
        aria-hidden
      />
    </div>
  );
}
