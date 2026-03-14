'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const GALLERY_IMAGES = [
  { src: '/images/about/about-img-primedealuto01.png', alt: 'Prime Deal Auto', slot: 'tall' as const },
  { src: '/images/about/About-img-primedeal3.jpg', alt: 'Prime Deal Auto', slot: 'wide' as const },
  { src: '/images/about/About-img-primedeal4.jpg', alt: 'Prime Deal Auto', slot: 'square' as const },
  { src: '/images/about/About-img-primedeal5.jpg', alt: 'Prime Deal Auto', slot: 'square' as const },
  { src: '/images/about/About-img-primedeal.png', alt: 'Prime Deal Auto', slot: 'wider' as const },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemFly = {
  hidden: { opacity: 0, y: 50 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 100, damping: 22 },
  },
};

const hoverTransition = { type: 'spring' as const, stiffness: 400, damping: 25 };
const hoverShadow = '0 25px 50px -12px rgba(0,0,0,0.25)';
const floatTransition = { repeat: Infinity, repeatType: 'reverse' as const, duration: 4.5 };

export function AboutGallery() {
  const [canFloat, setCanFloat] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 641px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setCanFloat(mq.matches && !reduced.matches);
    update();
    mq.addEventListener('change', update);
    reduced.addEventListener('change', update);
    return () => {
      mq.removeEventListener('change', update);
      reduced.removeEventListener('change', update);
    };
  }, []);

  return (
    <section className="mb-16 sm:mb-20">
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-40px' }}
      >
        {/* Highlight card 210×300 */}
        <motion.div
          className="col-span-2 lg:col-span-1 lg:row-span-2 flex flex-col justify-center bg-secondary rounded-[16px] p-6 min-h-[200px] sm:min-h-[300px] w-full max-w-[210px] mx-auto lg:mx-0 lg:max-w-none"
          variants={itemFly}
        >
          <span className="text-[52px] leading-[68px] font-medium text-white block">15</span>
          <span className="text-[30px] leading-[45px] font-bold text-white block">
            Years in Business
          </span>
        </motion.div>

        {/* Large tall ~567×540 */}
        <motion.div
          className="col-span-2 hidden lg:block rounded-[16px] min-h-[300px] lg:min-h-[540px] lg:row-span-2 relative overflow-hidden shadow-lg"
          variants={itemFly}
          animate={{ y: canFloat ? [0, -10, 0] : 0 }}
          transition={floatTransition}
          whileHover={{ scale: 1.03, rotateZ: 1, boxShadow: hoverShadow, transition: hoverTransition }}
        >
          <Image
            src={GALLERY_IMAGES[0].src}
            alt={GALLERY_IMAGES[0].alt}
            fill
            className="object-cover rounded-[16px]"
            sizes="(min-width: 1024px) 567px, 100vw"
          />
        </motion.div>

        {/* Large wide ~567×300 */}
        <motion.div
          className="col-span-2 hidden lg:block rounded-[16px] min-h-[300px] relative overflow-hidden shadow-lg"
          variants={itemFly}
          animate={{ y: canFloat ? [0, -10, 0] : 0 }}
          transition={floatTransition}
          whileHover={{ scale: 1.03, rotateZ: 1, boxShadow: hoverShadow, transition: hoverTransition }}
        >
          <Image
            src={GALLERY_IMAGES[1].src}
            alt={GALLERY_IMAGES[1].alt}
            fill
            className="object-cover rounded-[16px]"
            sizes="(min-width: 1024px) 567px, 100vw"
          />
        </motion.div>

        {/* Two small squares ~210×210 */}
        <motion.div
          className="col-span-1 rounded-[16px] min-h-[160px] sm:min-h-[210px] relative overflow-hidden shadow-lg"
          variants={itemFly}
          animate={{ y: canFloat ? [0, -10, 0] : 0 }}
          transition={floatTransition}
          whileHover={{ scale: 1.03, rotateZ: 1, boxShadow: hoverShadow, transition: hoverTransition }}
        >
          <Image
            src={GALLERY_IMAGES[2].src}
            alt={GALLERY_IMAGES[2].alt}
            fill
            className="object-cover rounded-[16px]"
            sizes="(min-width: 640px) 210px, 50vw"
          />
        </motion.div>
        <motion.div
          className="col-span-1 rounded-[16px] min-h-[160px] sm:min-h-[210px] relative overflow-hidden shadow-lg"
          variants={itemFly}
          animate={{ y: canFloat ? [0, -10, 0] : 0 }}
          transition={floatTransition}
          whileHover={{ scale: 1.03, rotateZ: 1, boxShadow: hoverShadow, transition: hoverTransition }}
        >
          <Image
            src={GALLERY_IMAGES[3].src}
            alt={GALLERY_IMAGES[3].alt}
            fill
            className="object-cover rounded-[16px]"
            sizes="(min-width: 640px) 210px, 50vw"
          />
        </motion.div>

        {/* Wider small ~329×210 */}
        <motion.div
          className="col-span-2 lg:col-span-1 rounded-[16px] min-h-[160px] sm:min-h-[210px] relative overflow-hidden shadow-lg"
          variants={itemFly}
          animate={{ y: canFloat ? [0, -10, 0] : 0 }}
          transition={floatTransition}
          whileHover={{ scale: 1.03, rotateZ: 1, boxShadow: hoverShadow, transition: hoverTransition }}
        >
          <Image
            src={GALLERY_IMAGES[4].src}
            alt={GALLERY_IMAGES[4].alt}
            fill
            className="object-cover rounded-[16px]"
            sizes="(min-width: 1024px) 329px, 100vw"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
