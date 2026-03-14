'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

type SortOption = { value: string; label: string };

const SORT_OPTIONS: SortOption[] = [
  { value: 'relevance', label: 'Best Match' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'year-desc', label: 'Year: Newest' },
  { value: 'year-asc', label: 'Year: Oldest' },
  { value: 'mileage-asc', label: 'Mileage: Low to High' },
  { value: 'mileage-desc', label: 'Mileage: High to Low' },
];

interface SortDropdownProps {
  currentSortBy?: string;
  currentSortOrder?: string;
  className?: string;
}

export function SortDropdown({
  currentSortBy = 'relevance',
  currentSortOrder = 'desc',
  className,
}: SortDropdownProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentValue =
    currentSortBy === 'relevance'
      ? 'relevance'
      : `${currentSortBy}-${currentSortOrder}`;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (value === 'relevance') {
      params.delete('sortBy');
      params.delete('sortOrder');
    } else {
      const [sortBy, sortOrder] = value.split('-') as [string, 'asc' | 'desc'];
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
    }
    router.push(`/cars?${params.toString()}`);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <label htmlFor="cars-sort" className="text-[14px] font-medium text-primary whitespace-nowrap">
        Sort by
      </label>
      <select
        id="cars-sort"
        value={currentValue}
        onChange={handleChange}
        className={cn(
          'min-h-[44px] min-w-[180px] px-4 py-2 text-[15px] rounded-[12px]',
          'border border-[#E1E1E1] bg-white text-primary',
          'focus:outline-none focus:ring-0 focus:border-[#405FF2]'
        )}
        aria-label="Sort results"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
