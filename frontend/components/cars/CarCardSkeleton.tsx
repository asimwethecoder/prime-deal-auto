// Car Card Skeleton Component
// Loading placeholder for CarCard

import { Skeleton } from '@/components/ui/Skeleton';

export function CarCardSkeleton() {
  return (
    <div className="bg-white border border-border rounded-card overflow-hidden">
      {/* Image skeleton */}
      <Skeleton className="w-full h-48" />
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title skeleton */}
        <Skeleton className="h-6 w-3/4" />
        
        {/* Price skeleton */}
        <Skeleton className="h-5 w-1/2" />
        
        {/* Details skeleton */}
        <div className="flex gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}
