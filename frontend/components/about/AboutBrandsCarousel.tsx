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
  { name: 'Honda', icon: 'honda-svgrepo-com.svg' },
  { name: 'Hyundai', icon: 'hyundai-svgrepo-com.svg' },
  { name: 'Jeep', icon: 'jeep-svgrepo-com.svg' },
  { name: 'Kia', icon: 'kia-svgrepo-com.svg' },
  { name: 'Land Rover', icon: 'landrover-svgrepo-com.svg' },
  { name: 'Suzuki', icon: 'suzuki-svgrepo-com.svg' },
  { name: 'Toyota', icon: 'toyota-svgrepo-com.svg' },
  { name: 'Volvo', icon: 'volvo-svgrepo-com.svg' },
  { name: 'Fiat', icon: 'fiat-svgrepo-com.svg' },
];

const DURATION = 40;

export function AboutBrandsCarousel() {
  const duplicated = [...BRANDS, ...BRANDS];

  return (
    <div className="overflow-hidden w-full -mx-4 sm:-mx-6 lg:-mx-8">
      <motion.div
        className="flex gap-4 w-max px-4 sm:px-6 lg:px-8"
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
            className="flex flex-col items-center justify-center w-[210px] h-[180px] shrink-0 p-4 bg-white rounded-[16px] border border-[#E1E1E1] shadow-[0px_2px_8px_rgba(0,0,0,0.08)] transition-all hover:border-primary hover:shadow-[0px_6px_24px_rgba(0,0,0,0.05)]"
          >
            <div className="relative w-20 h-20 mb-3 flex-shrink-0">
              <Image
                src={`/icons/${brand.icon}`}
                alt={brand.name}
                fill
                className="object-contain"
              />
            </div>
            <span className="text-[18px] leading-[32px] font-medium text-primary text-center">
              {brand.name}
            </span>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
