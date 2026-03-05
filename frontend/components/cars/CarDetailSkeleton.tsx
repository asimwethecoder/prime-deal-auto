// Car Detail Skeleton Component
// Loading placeholder for car detail page

import { Skeleton } from '@/components/ui/Skeleton';

export function CarDetailSkeleton() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image gallery skeleton */}
        <div className="space-y-4">
          <Skeleton className="w-full h-96 rounded-card" />
          <div className="grid grid-cols-4 gap-2">
            <Skeleton className="h-20 rounded-md" />
            <Skeleton className="h-20 rounded-md" />
            <Skeleton className="h-20 rounded-md" />
            <Skeleton className="h-20 rounded-md" />
          </div>
        </div>

        {/* Details skeleton */}
        <div className="space-y-6">
          {/* Title */}
          <Skeleton className="h-10 w-3/4" />
          
          {/* Price */}
          <Skeleton className="h-8 w-1/2" />
          
          {/* Specs */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
          
          {/* Features */}
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-24 rounded-pill" />
            <Skeleton className="h-8 w-32 rounded-pill" />
            <Skeleton className="h-8 w-28 rounded-pill" />
            <Skeleton className="h-8 w-36 rounded-pill" />
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          
          {/* Button */}
          <Skeleton className="h-12 w-full rounded-button" />
        </div>
      </div>
    </div>
  );
}
