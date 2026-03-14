'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { CarCard } from '@/components/cars/CarCard';
import { Pagination } from '@/components/ui/Pagination';
import { FilterSidebar } from '@/components/search/FilterSidebar';
import { SortDropdown } from '@/components/search/SortDropdown';
import type { FacetResult } from '@/lib/api/search';
import type { SearchParams } from '@/lib/api/search';
import type { CarWithImages } from '@/lib/api/types';
import type { PaginatedResponse } from '@/lib/api/types';

const DEFAULT_LIMIT = 20;

interface CarsPageClientProps {
  filters: Partial<SearchParams>;
  facets: FacetResult;
  carsData: PaginatedResponse<CarWithImages> | undefined;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  total?: number;
  limit?: number;
  offset?: number;
}

export function CarsPageClient({
  filters,
  facets,
  carsData,
  currentPage,
  totalPages,
  hasMore,
  total = 0,
  limit = DEFAULT_LIMIT,
  offset = 0,
}: CarsPageClientProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, total);

  return (
    <>
      {/* Toolbar: Summary + Filters (mobile) + Sort */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen((o) => !o)}
          className="lg:hidden min-h-[44px] min-w-[44px] px-4 py-2 flex items-center gap-2 text-[15px] font-medium text-primary border border-border rounded-button bg-white hover:bg-bg-1 transition-colors"
          aria-expanded={mobileFiltersOpen}
          aria-controls="cars-filter-sidebar"
        >
          Filters
          {mobileFiltersOpen ? ' (hide)' : ''}
        </button>
        {carsData != null && (
          <p className="text-[15px] leading-[26px] text-primary">
            Showing {from} to {to} of {total} vehicles
          </p>
        )}
        <SortDropdown
          currentSortBy={filters.sortBy}
          currentSortOrder={filters.sortOrder}
          className="ml-auto"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar: sticky, 329px on desktop */}
        <div
          id="cars-filter-sidebar"
          className={cn(
            mobileFiltersOpen ? 'block' : 'hidden',
            'w-full lg:block lg:w-[329px] lg:shrink-0 lg:self-start lg:sticky lg:top-24'
          )}
        >
          <FilterSidebar currentFilters={filters} facets={facets} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {carsData && carsData.data.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[30px] mb-12">
                {carsData.data.map((car) => (
                  <CarCard key={car.id} car={car} />
                ))}
              </div>
              {totalPages > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  hasMore={hasMore}
                  total={total}
                  limit={limit}
                />
              )}
            </>
          )}

          {carsData && carsData.data.length === 0 && (
            <div className="text-center py-20">
              <div className="bg-white rounded-[16px] p-12 shadow-[0px_2px_8px_rgba(0,0,0,0.08)]">
                <svg
                  className="w-24 h-24 mx-auto mb-6 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <h2 className="text-[30px] leading-[45px] font-bold text-primary mb-4">
                  No Cars Found
                </h2>
                <p className="text-[16px] leading-[28px] text-gray-600 mb-6">
                  Try adjusting your filters or search to find more vehicles.
                </p>
                <Link
                  href="/cars"
                  className="inline-block bg-secondary text-white px-8 py-4 rounded-[12px] text-[15px] leading-[26px] font-medium hover:bg-secondary/90 transition-colors"
                >
                  Clear filters
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
