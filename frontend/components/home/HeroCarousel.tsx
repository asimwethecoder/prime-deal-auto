'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

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

  return (
    <div className="col-start-1 row-start-1 min-h-[90vh] w-full grid relative">
      <div className="col-start-1 row-start-1 min-h-[90vh] w-full relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Image
              src={HERO_IMAGES[index]}
              alt=""
              fill
              priority={index === 0}
              className="object-cover"
              sizes="100vw"
            />
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Dark overlay for legibility - white text and AI bar pop */}
      <div
        className="col-start-1 row-start-1 min-h-[90vh] w-full absolute inset-0 bg-black/60 pointer-events-none"
        aria-hidden
      />
    </div>
  );
}
