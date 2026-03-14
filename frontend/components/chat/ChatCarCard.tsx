'use client';

// Chat Car Card Component
// Inline car card displayed when AI mentions a specific vehicle

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { getCar } from '@/lib/api/cars';
import { formatPrice, formatMileage } from '@/lib/utils/format';

interface ChatCarCardProps {
  carId: string;
}

export function ChatCarCard({ carId }: ChatCarCardProps) {
  const { data: car, isLoading, error } = useQuery({
    queryKey: ['cars', carId],
    queryFn: () => getCar(carId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="w-full max-w-[280px] rounded-xl border border-[#E1E1E1] overflow-hidden bg-white animate-shimmer">
        <div className="aspect-[16/10] bg-gray-200" />
        <div className="p-3">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-5 bg-gray-200 rounded w-1/2 mb-1" />
          <div className="h-3 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    );
  }

  // Error fallback - show link
  if (error || !car) {
    return (
      <Link
        href={`/cars/${carId}`}
        className="inline-flex items-center gap-1 text-[#405FF2] hover:underline text-sm"
      >
        View car details →
      </Link>
    );
  }

  const primaryImage = car.images?.find((img) => img.is_primary) || car.images?.[0];

  return (
    <Link
      href={`/cars/${carId}`}
      className="block w-full max-w-[280px] rounded-xl border border-[#E1E1E1] overflow-hidden bg-white hover:shadow-md transition-shadow group"
    >
      {/* Car Image */}
      <div className="aspect-[16/10] relative bg-gray-100">
        {primaryImage ? (
          <Image
            src={primaryImage.cloudfront_url}
            alt={`${car.year} ${car.make} ${car.model}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="280px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No image
          </div>
        )}
      </div>

      {/* Car Details */}
      <div className="p-3">
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
    </Link>
  );
}
