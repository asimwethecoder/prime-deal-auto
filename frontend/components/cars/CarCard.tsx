// Car Card Component
// Matches Figma: badge, bookmark, specs row, price, View Details link

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@/components/ui/Icon';
import { CarWithImages } from '@/lib/api/types';
import { formatPrice, formatMileage } from '@/lib/utils/format';

interface CarCardProps {
  car: CarWithImages;
  /** Optional badge label e.g. "Low Mileage" or "Great Price" */
  badge?: string;
  /** Optional original price for strikethrough display */
  originalPrice?: number;
}

export function CarCard({ car, badge, originalPrice }: CarCardProps) {
  const primaryImage = car.images.find(img => img.is_primary) || car.images[0];
  const imageUrl = primaryImage?.cloudfront_url || '/placeholder-car.jpg';

  const derivedBadge = badge ?? (car.mileage < 80000 ? 'Low Mileage' : undefined);
  const fuelLabel = car.fuel_type === 'petrol' ? 'Petrol' : car.fuel_type === 'diesel' ? 'Diesel' : car.fuel_type.charAt(0).toUpperCase() + car.fuel_type.slice(1);

  return (
    <Link
      href={`/cars/${car.id}`}
      className="group block bg-white border border-border rounded-[16px] overflow-hidden hover:border-secondary hover:shadow-card transition-all duration-300"
    >
      {/* Image area with badge and bookmark overlay */}
      <div className="relative w-full aspect-[329/240] bg-primary rounded-t-[16px] overflow-hidden">
        <Image
          src={imageUrl}
          alt={`${car.year} ${car.make} ${car.model}`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {derivedBadge && (
          <div className="absolute top-4 left-4">
            <span className="bg-secondary text-white text-[14px] font-medium px-3 py-1.5 rounded-full">
              {derivedBadge}
            </span>
          </div>
        )}
        <button
          type="button"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white shadow-bookmark flex items-center justify-center text-primary hover:bg-gray-50 transition-colors"
          aria-label="Save car"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          <Icon src="bookmark-svgrepo-com.svg" width={20} height={20} aria-hidden />
        </button>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="text-[18px] leading-[32px] font-medium text-primary mb-0.5">
          {car.make}, {car.body_type || 'Car'}
        </h3>
        <p className="text-[14px] leading-[24px] text-primary text-ellipsis overflow-hidden whitespace-nowrap mb-3">
          {car.year} {car.model}
        </p>

        {/* Specs row with dividers */}
        <div className="flex items-center gap-3 py-3 border-t border-border">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Icon src="speedometer-02-svgrepo-com.svg" width={16} height={16} className="shrink-0" aria-hidden />
            <span className="text-[14px] leading-[24px] text-primary truncate">{formatMileage(car.mileage)}</span>
          </div>
          <div className="w-px h-4 bg-border shrink-0" aria-hidden />
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Icon src="gas-pump-fill-svgrepo-com.svg" width={16} height={16} className="shrink-0" aria-hidden />
            <span className="text-[14px] leading-[24px] text-primary truncate">{fuelLabel}</span>
          </div>
          <div className="w-px h-4 bg-border shrink-0" aria-hidden />
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Icon src="gearbox-svgrepo-com.svg" width={16} height={16} className="shrink-0" aria-hidden />
            <span className="text-[14px] leading-[24px] text-primary truncate capitalize">{car.transmission}</span>
          </div>
        </div>

        <div className="border-t border-border pt-3 flex items-end justify-between gap-2 flex-wrap">
          <div className="flex flex-col">
            {originalPrice != null && (
              <span className="text-[14px] leading-[24px] text-primary line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
            <span className="text-[20px] leading-[30px] font-bold text-primary">
              {formatPrice(car.price)}
            </span>
          </div>
          <span className="flex items-center gap-1.5 text-secondary font-medium text-[15px] group-hover:text-secondary/80 transition-colors shrink-0">
            View Details
            <Icon src="arrow-up-right-svgrepo-com.svg" width={16} height={16} aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}
