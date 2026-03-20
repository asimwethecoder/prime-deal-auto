// Car Listing Page - Server Component with search, filters, and pagination

import type { Metadata } from 'next';
import Link from 'next/link';
import { searchCars, getSearchFacets } from '@/lib/api/search';
import type { SearchParams } from '@/lib/api/search';
import { RetryButton } from '@/components/ui/RetryButton';
import { CarsPageClient } from '@/components/cars/CarsPageClient';

export const metadata: Metadata = {
  title: 'Browse Cars',
  description:
    'Browse our complete inventory of quality used and new vehicles at Prime Deal Auto.',
  alternates: { canonical: '/cars' },
};

interface CarsPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    make?: string;
    model?: string;
    variant?: string;
    minPrice?: string;
    maxPrice?: string;
    minYear?: string;
    maxYear?: string;
    transmission?: string;
    fuelType?: string;
    bodyType?: string;
    condition?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

function parseNumber(value: string | undefined): number | undefined {
  if (value === undefined || value === '') return undefined;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? undefined : n;
}

export default async function CarsPage({ searchParams }: CarsPageProps) {
  const params = await searchParams;
  const currentPage = parseInt(params.page || '1', 10);
  const limit = 20;
  const offset = (currentPage - 1) * limit;

  const filters: Partial<SearchParams> = {
    q: params.q?.trim() || undefined,
    make: params.make || undefined,
    model: params.model || undefined,
    variant: params.variant || undefined,
    minPrice: parseNumber(params.minPrice),
    maxPrice: parseNumber(params.maxPrice),
    minYear: parseNumber(params.minYear),
    maxYear: parseNumber(params.maxYear),
    transmission:
      params.transmission === 'automatic' ||
      params.transmission === 'manual' ||
      params.transmission === 'cvt'
        ? params.transmission
        : undefined,
    fuelType:
      params.fuelType === 'petrol' ||
      params.fuelType === 'diesel' ||
      params.fuelType === 'electric' ||
      params.fuelType === 'hybrid'
        ? params.fuelType
        : undefined,
    bodyType: params.bodyType || undefined,
    condition:
      params.condition === 'excellent' ||
      params.condition === 'good' ||
      params.condition === 'fair' ||
      params.condition === 'poor'
        ? params.condition
        : undefined,
    sortBy:
      params.sortBy === 'price' ||
      params.sortBy === 'year' ||
      params.sortBy === 'mileage' ||
      params.sortBy === 'relevance'
        ? params.sortBy
        : undefined,
    sortOrder: params.sortOrder === 'asc' || params.sortOrder === 'desc' ? params.sortOrder : undefined,
  };

  let carsData: Awaited<ReturnType<typeof searchCars>> | undefined;
  let facetsData: Awaited<ReturnType<typeof getSearchFacets>> = {};
  let error: string | null = null;

  try {
    [carsData, facetsData] = await Promise.all([
      searchCars({
        ...filters,
        limit,
        offset,
      }),
      getSearchFacets(filters),
    ]);
  } catch (err) {
    console.error('Failed to fetch cars or facets:', err);
    error = err instanceof Error ? err.message : 'Failed to load cars';
  }

  const totalPages = carsData ? Math.ceil(carsData.total / limit) : 0;
  const hasMore = carsData ? carsData.hasMore : false;

  return (
    <div className="min-h-screen bg-[#F9FBFC] rounded-t-[80px]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="mb-2" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1 text-[15px] leading-[26px]">
            <li>
              <Link href="/" className="text-secondary hover:underline">
                Home
              </Link>
            </li>
            <li className="text-primary/60" aria-hidden>
              /
            </li>
            <li>
              <Link href="/cars" className="text-secondary hover:underline">
                Cars for Sale
              </Link>
            </li>
          </ol>
        </nav>
        <div className="mb-8">
          <h1 className="text-[40px] leading-[45px] font-bold text-primary mb-4">
            New and Used Cars For Sale
          </h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-[16px] p-8 text-center">
            <p className="text-red-600 text-lg mb-4">{error}</p>
            <RetryButton className="bg-red-600 text-white px-6 py-3 rounded-[12px] hover:bg-red-700 transition-colors" />
          </div>
        )}

        {!error && (
          <CarsPageClient
            filters={filters}
            facets={facetsData}
            carsData={carsData}
            currentPage={currentPage}
            totalPages={totalPages}
            hasMore={hasMore}
            total={carsData?.total ?? 0}
            limit={limit}
            offset={offset}
          />
        )}
      </div>
    </div>
  );
}
