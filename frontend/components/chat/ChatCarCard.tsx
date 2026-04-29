'use client';

// Chat Car Card Component
// Inline car card displayed when AI mentions a specific vehicle

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { getCar } from '@/lib/api/cars';
import { formatPrice, formatMileage } from '@/lib/utils/format';

interface ChatCarCardProps {
  carId: string;
}

export function ChatCarCard({ carId }: ChatCarCardProps) {
  const router = useRouter();
  const href = `/cars/${carId}`;

  /** Immediate client navigation; keep modifier clicks on native <Link> behavior. */
  const handleCardClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      router.push(href);
    },
    [href, router]
  );

  const { data: car, isLoading, error } = useQuery({
    queryKey: ['cars', carId],
    queryFn: () => getCar(carId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const cardLinkClass =
    'relative z-[1] block w-full max-w-[280px] rounded-xl border border-[#E1E1E1] overflow-hidden bg-white hover:shadow-md transition-shadow group touch-manipulation cursor-pointer';

  const tapHintFooter = (
    <div className="pointer-events-none flex items-center justify-between gap-2 border-t border-[#E1E1E1] bg-[#F9FBFC] px-3 py-2">
      <span className="text-[12px] font-medium leading-[20px] text-[#405FF2]">
        Tap to view listing
      </span>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-[#405FF2] transition-transform duration-200 group-hover:translate-x-0.5"
        aria-hidden
      />
    </div>
  );

  // Loading skeleton — still tappable so users can open the listing immediately
  if (isLoading) {
    return (
      <Link
        href={href}
        onClick={handleCardClick}
        className={`${cardLinkClass} animate-shimmer`}
        aria-busy="true"
        aria-label="Open car listing"
      >
        <div className="aspect-[16/10] bg-gray-200" />
        <div className="p-3">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-5 bg-gray-200 rounded w-1/2 mb-1" />
          <div className="h-3 bg-gray-200 rounded w-1/3" />
        </div>
        {tapHintFooter}
      </Link>
    );
  }

  // Error fallback - show link
  if (error || !car) {
    return (
      <Link
        href={href}
        onClick={handleCardClick}
        className="group relative z-[1] inline-flex items-center gap-1.5 rounded-lg border border-[#E1E1E1] bg-[#F9FBFC] px-3 py-2 text-[#405FF2] text-sm font-medium touch-manipulation hover:bg-[#EEF1FB]"
      >
        <span>View car details</span>
        <ChevronRight
          className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>
    );
  }

  const primaryImage = car.images?.find((img) => img.is_primary) || car.images?.[0];

  return (
    <Link
      href={href}
      onClick={handleCardClick}
      className={cardLinkClass}
      aria-label={`View ${car.year} ${car.make} ${car.model}`}
    >
      {/* Car Image */}
      <div className="aspect-[16/10] relative bg-gray-100 pointer-events-none">
        {primaryImage ? (
          <Image
            src={primaryImage.cloudfront_url}
            alt={`${car.year} ${car.make} ${car.model}`}
            fill
            draggable={false}
            className="object-cover group-hover:scale-105 transition-transform duration-300 select-none"
            sizes="280px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No image
          </div>
        )}
      </div>

      {/* Car Details */}
      <div className="p-3 pointer-events-none">
        <h4 className="text-[14px] leading-[24px] font-medium text-[#050B20] truncate">
          {car.year} {car.make} {car.model}
        </h4>
        <p className="text-[16px] leading-[28px] font-bold text-[#405FF2]">
          {formatPrice(car.price)}
        </p>
        <p className="text-[12px] text-gray-500">
          {formatMileage(car.mileage)}
        </p>
      </div>

      {tapHintFooter}
    </Link>
  );
}
