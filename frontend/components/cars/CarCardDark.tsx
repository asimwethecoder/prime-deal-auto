// Car Card Dark - List-Style-v2 for Popular Makes section
// Glassmorphism card, image left ~47%, content right, white text, bullet dots for multi-image

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { CarWithImages } from '@/lib/api/types';
import { formatPrice, formatMileage } from '@/lib/utils/format';

const MAX_DOTS = 7;

interface CarCardDarkProps {
  car: CarWithImages;
  badge?: string;
  originalPrice?: number;
}

export function CarCardDark({ car, badge, originalPrice }: CarCardDarkProps) {
  const images = car.images?.length ? car.images : [];
  const primaryIndex = images.findIndex((img) => img.is_primary);
  const [currentIndex, setCurrentIndex] = useState(primaryIndex >= 0 ? primaryIndex : 0);
  const currentImage = images[currentIndex] || images[0];
  
  // Use cloudfront_url from images array, or fall back to primary_image_url from search API
  const imageUrl = currentImage?.cloudfront_url || car.primary_image_url || '/placeholder-car.jpg';

  const showGreatPrice = originalPrice != null && originalPrice > car.price;
  const lowMileageBadge = car.mileage < 80000 ? 'Low Mileage' : undefined;
  const displayBadge = badge ?? lowMileageBadge;

  const fuelLabel =
    car.fuel_type === 'petrol'
      ? 'Petrol'
      : car.fuel_type === 'diesel'
        ? 'Diesel'
        : car.fuel_type.charAt(0).toUpperCase() + car.fuel_type.slice(1);

  const subtitle = car.variant
    ? `${car.year} ${car.variant}`
    : `${car.year} ${car.model}`;

  const dots = images.slice(0, MAX_DOTS);

  return (
    <Link
      href={`/cars/${car.id}`}
      className="block min-h-[44px] h-full"
      aria-label={`View details for ${car.year} ${car.make} ${car.model}`}
    >
      <motion.div
        className="group flex h-full min-h-[280px] flex-col overflow-hidden rounded-[16px] bg-white/[0.07] sm:min-h-[320px] sm:flex-row"
        whileHover={{ boxShadow: '0px 6px 24px rgba(0, 0, 0, 0.08)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Image area - full width on mobile, left ~47% on desktop */}
        <div className="relative h-[180px] w-full shrink-0 overflow-hidden rounded-t-[16px] bg-primary sm:h-auto sm:w-[47%] sm:rounded-l-[16px] sm:rounded-tr-none">
          <div className="absolute inset-0">
            <Image
              src={imageUrl}
              alt={`${car.year} ${car.make} ${car.model}`}
              fill
              className="object-cover transition-opacity duration-200"
              sizes="340px"
            />
          </div>
          <div
            className="absolute inset-0 rounded-t-[16px] bg-gradient-to-b from-primary/0 to-primary opacity-30 pointer-events-none sm:rounded-l-[16px] sm:rounded-tr-none"
            aria-hidden
          />
          {/* Badges */}
          <div className="absolute top-5 left-5 z-10 flex flex-wrap gap-2">
            {showGreatPrice && (
              <span className="h-[30px] px-[15px] inline-flex items-center rounded-full text-[14px] font-medium text-white bg-third">
                Great Price
              </span>
            )}
            {displayBadge && (
              <span className="h-[30px] px-[15px] inline-flex items-center rounded-full text-[14px] font-medium text-white bg-secondary">
                {displayBadge}
              </span>
            )}
          </div>
          <motion.button
            type="button"
            className="absolute top-5 right-5 z-10 w-9 h-9 rounded-full bg-white shadow-[0px_10px_40px_rgba(0,0,0,0.05)] flex items-center justify-center text-primary hover:bg-gray-50"
            aria-label="Save car"
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Icon src="bookmark-svgrepo-com.svg" width={12} height={12} aria-hidden />
          </motion.button>
          {/* Bullet dots - only when multiple images */}
          {dots.length > 1 && (
            <div
              className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1"
              onClick={(e) => e.preventDefault()}
              role="presentation"
            >
              {dots.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`View image ${i + 1} of ${dots.length}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentIndex(i);
                  }}
                  className={`h-1 rounded-[10px] transition-all duration-200 ${
                    i === currentIndex ? 'w-4 bg-white' : 'w-1 bg-white/50 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content - right ~53% */}
        <div className="flex flex-1 flex-col justify-between p-4 min-w-0">
          <div>
            <h3 className="text-[18px] leading-[32px] font-medium text-white mb-0.5">
              {car.make}, {car.model}
            </h3>
            <p className="text-[14px] leading-[24px] text-white truncate mb-3" title={subtitle}>
              {subtitle}
            </p>

            {/* Specs row */}
            <div className="grid grid-cols-3 gap-2 py-3">
              <div className="flex flex-col items-center gap-1 min-w-0">
                <DynamicIcon name="speedometer-02-svgrepo-com" width={16} height={16} className="shrink-0 [filter:brightness(0)_invert(1)]" aria-hidden />
                <span className="text-[14px] leading-[24px] text-white truncate w-full text-center">
                  {formatMileage(car.mileage)}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 min-w-0">
                <DynamicIcon name="gas-pump-fill-svgrepo-com" width={16} height={16} className="shrink-0 [filter:brightness(0)_invert(1)]" aria-hidden />
                <span className="text-[14px] leading-[24px] text-white truncate w-full text-center">
                  {fuelLabel}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 min-w-0">
                <DynamicIcon name="gearbox-svgrepo-com" width={16} height={16} className="shrink-0 [filter:brightness(0)_invert(1)]" aria-hidden />
                <span className="text-[14px] leading-[24px] text-white truncate w-full text-center capitalize">
                  {car.transmission}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-end justify-between gap-2 flex-wrap border-t border-white/20 pt-4 mt-auto">
            <div className="flex flex-col">
              {originalPrice != null && originalPrice > car.price && (
                <span className="text-[14px] leading-[24px] text-white line-through">
                  {formatPrice(originalPrice)}
                </span>
              )}
              <span className="text-[20px] leading-[30px] font-bold text-white">
                {formatPrice(car.price)}
              </span>
            </div>
            <span className="flex items-center gap-1.5 min-h-[44px] min-w-[44px] items-center justify-end text-white font-medium text-[15px] group-hover:text-white/90 transition-colors shrink-0">
              View Details
              <Icon src="arrow-up-right-svgrepo-com.svg" width={14} height={14} className="invert" aria-hidden />
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
