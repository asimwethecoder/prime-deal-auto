'use client';

// Pagination Component
// Client component for page navigation

import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils/cn';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

export function Pagination({ currentPage, totalPages, hasMore }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`?${params.toString()}`);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (hasMore) {
      handlePageChange(currentPage + 1);
    }
  };

  return (
    <nav className="flex items-center justify-center gap-4" aria-label="Pagination">
      {/* Previous: bg F9FBFC, border 050B20 when enabled */}
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-full border transition-colors shrink-0',
          'min-w-[44px] min-h-[44px]',
          currentPage === 1
            ? 'bg-bg-1 border-border text-gray-400 cursor-not-allowed'
            : 'bg-bg-1 border-primary text-primary hover:opacity-90'
        )}
        aria-label="Previous page"
      >
        <Icon src="chevron-left-double-svgrepo-com.svg" width={20} height={20} aria-hidden />
      </button>

      {/* Current page of total (Figma style) */}
      <span className="text-[15px] leading-[26px] text-primary min-w-[4rem] text-center">
        {currentPage} of {totalPages}
      </span>

      {/* Next: white bg, border E1E1E1 when enabled */}
      <button
        onClick={handleNext}
        disabled={!hasMore}
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-full border transition-colors shrink-0',
          'min-w-[44px] min-h-[44px]',
          !hasMore
            ? 'bg-white border-border text-gray-400 cursor-not-allowed'
            : 'bg-white border-border text-primary hover:bg-bg-1'
        )}
        aria-label="Next page"
      >
        <Icon src="chevron-right-double-svgrepo-com.svg" width={20} height={20} aria-hidden />
      </button>
    </nav>
  );
}
