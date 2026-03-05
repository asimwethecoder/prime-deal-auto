'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

const BRANDS = [
  { name: 'Audi', icon: 'audi-svgrepo-com.svg' },
  { name: 'BMW', icon: 'bmw-svgrepo-com.svg' },
  { name: 'Ford', icon: 'ford-svgrepo-com.svg' },
  { name: 'Mercedes Benz', icon: 'mercedes-svgrepo-com.svg' },
  { name: 'Renault', icon: 'renault-svgrepo-com.svg' },
  { name: 'Volkswagen', icon: 'volkswagen-svgrepo-com.svg' },
];

const DURATION = 25;

export function BrandCarousel() {
  const duplicated = [...BRANDS, ...BRANDS];

  return (
    <div className="overflow-hidden w-full">
      <motion.div
        className="flex gap-6 w-max"
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          duration: DURATION,
          repeat: Infinity,
          repeatType: 'loop',
          ease: 'linear',
        }}
      >
        {duplicated.map((brand, index) => (
          <Link
            key={`${brand.name}-${index}`}
            href={`/cars?make=${encodeURIComponent(brand.name.replace(' ', ''))}`}
            className="flex flex-col items-center justify-center w-[180px] min-h-[140px] p-6 bg-white rounded-[16px] border border-gray-200 transition-all shrink-0 hover:border-secondary hover:shadow-md hover:shadow-secondary/10"
          >
            <div className="relative w-[80px] h-[80px] mb-3">
              <Image
                src={`/icons/${brand.icon}`}
                alt={brand.name}
                fill
                className="object-contain opacity-90 hover:opacity-100 transition-opacity"
              />
            </div>
            <span className="text-[16px] leading-[24px] font-medium text-primary text-center">
              {brand.name}
            </span>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
