'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { CarCard } from '@/components/cars/CarCard';
import { CarWithImages } from '@/lib/api/types';

const PAGE_SIZE = 5;
const CURRENT_YEAR = new Date().getFullYear();

type TabId = 'new' | 'used' | 'in_stock';

const TABS: { id: TabId; label: string }[] = [
  { id: 'new', label: 'New Cars' },
  { id: 'used', label: 'Used Cars' },
  { id: 'in_stock', label: 'In Stock' },
];

interface ExploreAllVehiclesSectionProps {
  cars: CarWithImages[];
}

export function ExploreAllVehiclesSection({ cars }: ExploreAllVehiclesSectionProps) {
  const [activeTab, setActiveTab] = useState<TabId>('new');
  const [pageIndex, setPageIndex] = useState(0);

  const filteredCars = useMemo(() => {
    if (activeTab === 'new') {
      return cars.filter((c) => c.year >= CURRENT_YEAR - 1);
    }
    if (activeTab === 'used') {
      return cars.filter((c) => c.year < CURRENT_YEAR - 1);
    }
    return cars;
  }, [cars, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredCars.length / PAGE_SIZE));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const start = safePageIndex * PAGE_SIZE;
  const slice = filteredCars.slice(start, start + PAGE_SIZE);

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
            aria-label="Filter by vehicle type"
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

        {filteredCars.length === 0 ? (
          <p className="text-[15px] leading-[26px] text-primary py-8 text-center">
            No vehicles match this filter.
          </p>
        ) : (
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
              {slice.length} of {filteredCars.length}
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
        )}
      </div>
    </section>
  );
}
