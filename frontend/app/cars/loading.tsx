// Loading state for Car Listing page
// Displays skeleton placeholders while cars are being fetched

import { CarCardSkeleton } from '@/components/cars/CarCardSkeleton';

export default function CarsLoading() {
  return (
    <div className="min-h-screen bg-[#F9FBFC]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header Skeleton */}
        <div className="mb-8">
          <div className="h-12 w-64 bg-gray-200 rounded-md animate-pulse mb-4"></div>
          <div className="h-6 w-48 bg-gray-200 rounded-md animate-pulse"></div>
        </div>

        {/* Cars Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {Array.from({ length: 20 }).map((_, i) => (
            <CarCardSkeleton key={i} />
          ))}
        </div>

        {/* Pagination Skeleton */}
        <div className="flex justify-center items-center gap-2">
          <div className="h-10 w-24 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="h-10 w-10 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="h-10 w-10 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="h-10 w-10 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="h-10 w-24 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
