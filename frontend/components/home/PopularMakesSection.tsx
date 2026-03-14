'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { CarCardDark } from '@/components/cars/CarCardDark';
import { searchCars } from '@/lib/api/search';
import type { FacetResult } from '@/lib/api/search';
import type { CarWithImages } from '@/lib/api/types';

const CARDS_PER_PAGE = 3;
const CAR_LIMIT = 12;
const TOP_MAKES = 6;
const FALLBACK_MAKES = ['Audi', 'BMW', 'Mercedes-Benz'];

interface PopularMakesSectionProps {
  facets: FacetResult;
}

export function PopularMakesSection({ facets }: PopularMakesSectionProps) {
  const makeOptions = facets?.make ?? [];
  const topMakes = useMemo(() => {
    const fromFacets = makeOptions.slice(0, TOP_MAKES).map((m) => m.value);
    return fromFacets.length > 0 ? fromFacets : FALLBACK_MAKES;
  }, [makeOptions]);
  const firstMake = topMakes[0] ?? '';
  const [activeMake, setActiveMake] = useState(firstMake);
  const [pageIndex, setPageIndex] = useState(0);

  const { data: searchResult, isLoading } = useQuery({
    queryKey: ['popular-makes-cars', activeMake],
    queryFn: () => searchCars({ make: activeMake, limit: CAR_LIMIT }),
    enabled: !!activeMake,
  });

  const cars: CarWithImages[] = searchResult?.data ?? [];
  const total = searchResult?.total ?? 0;

  const totalPages = Math.max(1, Math.ceil(cars.length / CARDS_PER_PAGE));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const start = safePageIndex * CARDS_PER_PAGE;
  const slice = cars.slice(start, start + CARDS_PER_PAGE);

  const goPrev = () => setPageIndex((p) => Math.max(0, p - 1));
  const goNext = () => setPageIndex((p) => Math.min(totalPages - 1, p + 1));

  const handleTabChange = (make: string) => {
    setActiveMake(make);
    setPageIndex(0);
  };

  return (
    <section
      className="bg-primary py-12 md:min-h-[806px] md:py-20"
      aria-labelledby="popular-makes-heading"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2
            id="popular-makes-heading"
            className="text-[30px] leading-tight md:text-[40px] md:leading-[45px] font-bold text-white"
          >
            Popular Makes
          </h2>
          <Link
            href="/cars"
            className="flex items-center gap-2 text-white font-medium text-[15px] leading-[26px] hover:text-white/90 transition-colors focus-visible:outline-2 outline-offset-2 outline-white rounded"
          >
            View All Makes
            <ArrowUpRight className="w-[14px] h-[14px] shrink-0" aria-hidden />
          </Link>
        </div>

        {/* Tabs */}
        {topMakes.length > 0 && (
          <div className="border-b border-white/20 mb-8">
            <div
              role="tablist"
              aria-label="Filter by make"
              className="flex flex-row items-start gap-8"
            >
              {topMakes.map((make) => (
                <button
                  key={make}
                  role="tab"
                  aria-selected={activeMake === make}
                  onClick={() => handleTabChange(make)}
                  className="flex flex-col gap-[15px] pb-0 pt-0 focus-visible:outline-2 outline-offset-2 outline-white rounded"
                >
                  <span
                    className={`text-[16px] leading-[28px] font-medium text-white ${
                      activeMake === make ? 'border-b-2 border-white pb-0.5' : ''
                    }`}
                  >
                    {make}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Slider */}
        {!activeMake ? (
          <p className="text-white/80 text-[15px] py-12 text-center">
            No makes available. Check back later.
          </p>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[320px] rounded-[16px] bg-white/[0.07] animate-pulse"
              />
            ))}
          </div>
        ) : cars.length === 0 ? (
          <p className="text-white/80 text-[15px] py-12 text-center">
            No cars found for {activeMake}.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {slice.map((car) => (
                <CarCardDark key={car.id} car={car} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center gap-5 mt-8">
              <button
                type="button"
                onClick={goPrev}
                disabled={safePageIndex === 0}
                aria-label="Previous page"
                className="w-[60px] h-10 flex items-center justify-center rounded-[30px] border border-white bg-transparent text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 focus-visible:outline-2 outline-offset-2 outline-white"
              >
                <ChevronLeft className="w-5 h-5" aria-hidden />
              </button>
              <span className="text-[15px] leading-[26px] text-white min-w-[4rem] text-center">
                {slice.length} of {cars.length}
              </span>
              <button
                type="button"
                onClick={goNext}
                disabled={safePageIndex >= totalPages - 1}
                aria-label="Next page"
                className="w-[60px] h-10 flex items-center justify-center rounded-[30px] border border-white bg-transparent text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 focus-visible:outline-2 outline-offset-2 outline-white"
              >
                <ChevronRight className="w-5 h-5" aria-hidden />
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
