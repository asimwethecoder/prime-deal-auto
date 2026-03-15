'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { CarCard } from '@/components/cars/CarCard';
import { searchCars } from '@/lib/api/search';
import type { CarWithImages } from '@/lib/api/types';

const PAGE_SIZE = 4;

type TabId = 'suv' | 'bakkie' | 'sedan';

const TABS: { id: TabId; label: string; bodyType: string }[] = [
  { id: 'suv', label: 'SUVs', bodyType: 'SUV' },
  { id: 'bakkie', label: 'Bakkies', bodyType: 'Bakkie' },
  { id: 'sedan', label: 'Sedans', bodyType: 'Sedan' },
];

export function ExploreAllVehiclesSection() {
  const [activeTab, setActiveTab] = useState<TabId>('suv');
  const [pageIndex, setPageIndex] = useState(0);

  const activeBodyType = TABS.find((t) => t.id === activeTab)?.bodyType ?? 'SUV';

  // Fetch cars filtered by body type
  const { data: searchResult, isLoading } = useQuery({
    queryKey: ['explore-vehicles', activeBodyType],
    queryFn: () => searchCars({ bodyType: activeBodyType, limit: 12 }),
    staleTime: 60_000,
  });

  const cars: CarWithImages[] = searchResult?.data ?? [];

  const totalPages = Math.max(1, Math.ceil(cars.length / PAGE_SIZE));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const start = safePageIndex * PAGE_SIZE;
  const slice = cars.slice(start, start + PAGE_SIZE);

  const goPrev = () => setPageIndex((p) => Math.max(0, p - 1));
  const goNext = () => setPageIndex((p) => Math.min(totalPages - 1, p + 1));

  const handleTabChange = (id: TabId) => {
    setActiveTab(id);
    setPageIndex(0);
  };

  return (
    <section className="py-16 bg-white" aria-labelledby="explore-all-vehicles-heading">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2
            id="explore-all-vehicles-heading"
            className="text-[40px] leading-[45px] font-bold text-primary"
          >
            Explore All Vehicles
          </h2>
          <Link
            href="/cars"
            className="flex items-center gap-2 text-primary font-medium text-[15px] leading-[26px] hover:text-secondary transition-colors focus-visible:outline-2 outline-offset-2 outline-secondary rounded"
          >
            View All
            <ArrowUpRight className="w-[14px] h-[14px] shrink-0" aria-hidden />
          </Link>
        </div>

        <div className="border-b border-[#E1E1E1] mb-8">
          <div
            role="tablist"
            aria-label="Filter by body type"
            className="flex flex-row items-start gap-8"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls="explore-vehicles-grid"
                id={`tab-${tab.id}`}
                onClick={() => handleTabChange(tab.id)}
                className="flex flex-col gap-[15px] pb-0 pt-0 focus-visible:outline-2 outline-offset-2 outline-secondary rounded"
              >
                <span
                  className={`text-[16px] leading-[28px] font-medium text-primary ${
                    activeTab === tab.id ? 'border-b-2 border-secondary pb-0.5' : ''
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-[320px] rounded-[16px] bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : cars.length === 0 ? (
          <p className="text-[15px] leading-[26px] text-primary py-8 text-center">
            No {TABS.find((t) => t.id === activeTab)?.label.toLowerCase()} available at the moment.
          </p>
        ) : (
          <>
            <div
              id="explore-vehicles-grid"
              role="tabpanel"
              aria-labelledby={`tab-${activeTab}`}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {slice.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>

            <div className="flex items-center gap-5 mt-8">
              <button
                type="button"
                onClick={goPrev}
                disabled={safePageIndex === 0}
                aria-label="Previous page"
                className="w-[60px] h-10 flex items-center justify-center rounded-[30px] border border-primary bg-[#F9FBFC] text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/5 focus-visible:outline-2 outline-offset-2 outline-secondary"
              >
                <ChevronLeft className="w-5 h-5" aria-hidden />
              </button>
              <span className="text-[15px] leading-[26px] text-primary min-w-[4rem] text-center">
                {slice.length} of {cars.length}
              </span>
              <button
                type="button"
                onClick={goNext}
                disabled={safePageIndex >= totalPages - 1}
                aria-label="Next page"
                className="w-[60px] h-10 flex items-center justify-center rounded-[30px] border border-[#E1E1E1] bg-white text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 focus-visible:outline-2 outline-offset-2 outline-secondary"
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
