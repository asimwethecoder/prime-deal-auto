// Car Card Component - List-Style-v1
// Figma: badge, bookmark, overlay, specs row, price, View Details, Framer Motion
// High-fidelity: full car identity, DynamicIcon specs, ZAR 22px, hover-only shadow

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { CarWithImages } from '@/lib/api/types';
import { formatPrice, formatMileage } from '@/lib/utils/format';

interface CarCardProps {
  car: CarWithImages;
  /** Optional badge label e.g. "Low Mileage" or "Featured" */
  badge?: string;
  /** Optional original price for strikethrough and Great Price badge */
  originalPrice?: number;
  /** Set true for above-the-fold cards to load image immediately */
  priority?: boolean;
}

const CLOUDFRONT_BASE = process.env.NEXT_PUBLIC_CLOUDFRONT_URL ?? 'https://dyzz4logwgput.cloudfront.net';

const cardHover = {
  y: -2,
  boxShadow: '0px 6px 24px rgba(0, 0, 0, 0.05)',
  transition: { type: 'spring' as const, stiffness: 300, damping: 20 },
};

export function CarCard({ car, badge, originalPrice, priority }: CarCardProps) {
  const images = car.images ?? [];
  const primaryImage = images.find((img) => img.is_primary) || images[0];
  const rawUrl = primaryImage?.cloudfront_url || car.primary_image_url || '/placeholder-car.jpg';
  const imageUrl = rawUrl.startsWith('http') || rawUrl === '/placeholder-car.jpg'
    ? rawUrl
    : `${CLOUDFRONT_BASE}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;

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

  return (
    <Link href={`/cars/${car.id}`} className="block min-h-[44px]" aria-label={`View details for ${car.year} ${car.make} ${car.model}`}>
      <motion.div
        className="group bg-white border border-[#E1E1E1] rounded-[16px] overflow-hidden hover:shadow-[0px_6px_24px_rgba(0,0,0,0.05)]"
        whileHover={cardHover}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Image area: aspect-video on mobile, fixed height on desktop; overlay, zoom on hover */}
        <div className="relative w-full aspect-video md:aspect-auto md:h-[230px] bg-primary rounded-t-[16px] overflow-hidden">
          <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-105">
            <Image
              src={imageUrl}
              alt={`${car.year} ${car.make} ${car.model}`}
              fill
              priority={priority}
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
          {/* Gradient overlay */}
          <div
            className="absolute inset-0 rounded-t-[16px] bg-gradient-to-b from-primary/0 to-primary opacity-30 pointer-events-none"
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
            className="absolute top-5 right-5 z-10 w-9 h-9 rounded-full bg-white shadow-bookmark flex items-center justify-center text-primary hover:bg-gray-50"
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
        </div>

        {/* Body */}
        <div className="p-4">
          <h3 className="text-[18px] leading-[32px] font-medium text-primary mb-0.5">
            {car.make}, {car.model}
          </h3>
          <p className="text-[14px] leading-[24px] text-primary truncate mb-3" title={subtitle}>
            {subtitle}
          </p>

          {/* Specs row - DynamicIcon: local SVG first, Lucide fallback */}
          <div className="grid grid-cols-3 gap-2 py-4 border-b border-[#E1E1E1]">
            <div className="flex flex-col items-center gap-1 min-w-0">
              <DynamicIcon name="speedometer-02-svgrepo-com" width={16} height={16} className="shrink-0" aria-hidden />
              <span className="text-[14px] leading-[24px] text-primary truncate w-full text-center">
                {formatMileage(car.mileage)}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 min-w-0">
              <DynamicIcon name="gas-pump-fill-svgrepo-com" width={16} height={16} className="shrink-0" aria-hidden />
              <span className="text-[14px] leading-[24px] text-primary truncate w-full text-center">
                {fuelLabel}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 min-w-0">
              <DynamicIcon name="gearbox-svgrepo-com" width={16} height={16} className="shrink-0" aria-hidden />
              <span className="text-[14px] leading-[24px] text-primary truncate w-full text-center capitalize">
                {car.transmission}
              </span>
            </div>
          </div>

          <div className="border-t border-[#E1E1E1] pt-4 flex items-end justify-between gap-2 flex-wrap">
            <div className="flex flex-col">
              {originalPrice != null && originalPrice > car.price && (
                <span className="text-[14px] leading-[24px] text-primary line-through">
                  {formatPrice(originalPrice)}
                </span>
              )}
              <span className="text-[20px] leading-[30px] font-bold text-primary">
                {formatPrice(car.price)}
              </span>
            </div>
            <span className="flex items-center gap-1.5 min-h-[44px] min-w-[44px] items-center justify-end text-secondary font-medium text-[15px] group-hover:text-secondary/80 transition-colors shrink-0">
              View Details
              <Icon src="arrow-up-right-svgrepo-com.svg" width={14} height={14} aria-hidden />
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
