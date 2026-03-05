'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const HERO_IMAGES = [
  '/images/hero/hero1.jpg',
  '/images/hero/hero2.jpg',
  '/images/hero/hero3.jpg',
  '/images/hero/hero4.jpg',
  '/images/hero/hero5.jpg',
  '/images/hero/hero6.jpg',
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
      {/* Dark overlay for text and nav legibility */}
      <div
        className="col-start-1 row-start-1 min-h-[90vh] w-full absolute inset-0 bg-black/30 pointer-events-none"
        aria-hidden
      />
    </div>
  );
}
