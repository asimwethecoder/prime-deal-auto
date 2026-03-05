// Car Listing Page - Server Component with pagination
// Displays all cars with pagination controls

import type { Metadata } from 'next';
import Link from 'next/link';
import { getCars } from '@/lib/api/cars';
import { CarCard } from '@/components/cars/CarCard';
import { Pagination } from '@/components/ui/Pagination';
import { RetryButton } from '@/components/ui/RetryButton';

// Page metadata
export const metadata: Metadata = {
  title: 'Browse Cars',
  description: 'Browse our complete inventory of quality used and new vehicles at Prime Deal Auto.',
};

interface CarsPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function CarsPage({ searchParams }: CarsPageProps) {
  // Parse page from search params (default to 1)
  const { page } = await searchParams;
  const currentPage = parseInt(page || '1', 10);
  const limit = 20;
  const offset = (currentPage - 1) * limit;

  let carsData;
  let error = null;

  try {
    // Fetch cars from API with pagination
    carsData = await getCars({ limit, offset });
  } catch (err) {
    console.error('Failed to fetch cars:', err);
    error = err instanceof Error ? err.message : 'Failed to load cars';
  }

  // Calculate pagination info
  const totalPages = carsData ? Math.ceil(carsData.total / limit) : 0;
  const hasMore = carsData ? carsData.hasMore : false;

  return (
    <div className="min-h-screen bg-[#F9FBFC]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-[40px] leading-[45px] font-bold text-primary mb-4">
            Browse Our Cars
          </h1>
          {carsData && (
            <p className="text-[16px] leading-[28px] text-gray-600">
              Showing {offset + 1}-{Math.min(offset + limit, carsData.total)} of {carsData.total} cars
            </p>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-[16px] p-8 text-center">
            <p className="text-red-600 text-lg mb-4">{error}</p>
            <RetryButton className="bg-red-600 text-white px-6 py-3 rounded-[12px] hover:bg-red-700 transition-colors" />
          </div>
        )}

        {/* Cars Grid */}
        {carsData && carsData.data.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {carsData.data.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                hasMore={hasMore}
              />
            )}
          </>
        )}

        {/* Empty State */}
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
                We don't have any cars available at the moment. Check back soon for new arrivals!
              </p>
              <Link
                href="/"
                className="inline-block bg-secondary text-white px-8 py-4 rounded-[12px] text-[15px] leading-[26px] font-medium hover:bg-secondary/90 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
