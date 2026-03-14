'use client';

// Pagination Component - Figma: numbered circles, prev/next, "Showing results X–Y of Z"

import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils/cn';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  total: number;
  limit: number;
}

function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | 'ellipsis')[] = [];
  pages.push(1);
  const left = Math.max(2, currentPage - 2);
  const right = Math.min(totalPages - 1, currentPage + 2);
  if (left > 2) pages.push('ellipsis');
  for (let i = left; i <= right; i++) {
    if (i !== 1 && i !== totalPages) pages.push(i);
  }
  if (right < totalPages - 1) pages.push('ellipsis');
  if (totalPages > 1) pages.push(totalPages);
  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  hasMore,
  total,
  limit,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const offset = (currentPage - 1) * limit;
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, total);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`?${params.toString()}`);
  };

  const handlePrevious = () => {
    if (currentPage > 1) handlePageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (hasMore) handlePageChange(currentPage + 1);
  };

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div className="flex flex-col items-center gap-6">
      <nav
        className="flex flex-wrap items-center justify-center gap-2"
        aria-label="Pagination"
      >
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-full border transition-colors shrink-0',
            'min-w-[40px] min-h-[40px]',
            currentPage === 1
              ? 'bg-bg-1 border-border text-gray-400 cursor-not-allowed'
              : 'bg-bg-1 border-primary text-primary hover:opacity-90'
          )}
          aria-label="Previous page"
        >
          <Icon src="chevron-left-double-svgrepo-com.svg" width={20} height={20} aria-hidden />
        </button>

        {pageNumbers.map((p, i) =>
          p === 'ellipsis' ? (
            <span
              key={`ellipsis-${i}`}
              className="flex items-center justify-center w-10 h-10 text-[15px] font-medium text-primary"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => handlePageChange(p)}
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full border transition-colors shrink-0 min-w-[40px] min-h-[40px] text-[15px] font-medium',
                currentPage === p
                  ? 'bg-primary border-primary text-white'
                  : 'bg-white border-border text-primary hover:bg-bg-1'
              )}
              aria-label={`Page ${p}`}
              aria-current={currentPage === p ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={handleNext}
          disabled={!hasMore}
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-full border transition-colors shrink-0',
            'min-w-[40px] min-h-[40px]',
            !hasMore
              ? 'bg-white border-border text-gray-400 cursor-not-allowed'
              : 'bg-white border-border text-primary hover:bg-bg-1'
          )}
          aria-label="Next page"
        >
          <Icon src="chevron-right-double-svgrepo-com.svg" width={20} height={20} aria-hidden />
        </button>
      </nav>

      <p className="text-[14px] leading-[26px] text-primary text-center">
        Showing results {from}–{to} of {total}
      </p>
    </div>
  );
}
