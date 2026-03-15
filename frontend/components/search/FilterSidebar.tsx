'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { Check, ChevronDown } from 'lucide-react';
import { AISearchBar } from '@/components/search/AISearchBar';
import type { FacetResult } from '@/lib/api/search';
import type { SearchParams } from '@/lib/api/search';

const PRICE_MIN = 0;
const PRICE_MAX = 2_000_000;
const PRICE_STEP = 10_000;

interface FilterSidebarProps {
  currentFilters: Partial<SearchParams>;
  facets: FacetResult;
  className?: string;
}

function buildParams(
  searchParams: URLSearchParams,
  updates: Record<string, string | number | undefined>
): string {
  const params = new URLSearchParams(searchParams.toString());
  params.delete('page');
  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined || value === '') {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

function FacetCheckboxList({
  title,
  facetKey,
  currentValue,
  items,
  searchParams,
}: {
  title: string;
  facetKey: string;
  currentValue?: string;
  items: Array<{ value: string; count: number }>;
  searchParams: URLSearchParams;
}) {
  if (!items || items.length === 0) return null;
  return (
    <div className="pb-6 mb-6 border-b border-border">
      <h3 className="text-[18px] font-medium text-primary mb-3">{title}</h3>
      <ul className="flex flex-col gap-3">
        <li>
          <Link
            href={currentValue ? `/cars?${buildParams(searchParams, { [facetKey]: undefined })}` : '#'}
            className={cn(
              'flex items-center gap-3 py-1 cursor-pointer group',
              !currentValue && 'pointer-events-none'
            )}
            aria-pressed={!currentValue}
          >
            <span
              className={cn(
                'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors',
                !currentValue ? 'bg-primary border-primary' : 'bg-white border-border'
              )}
            >
              {!currentValue && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </span>
            <span className={cn('text-[15px] text-primary', !currentValue && 'font-medium')}>
              All
            </span>
          </Link>
        </li>
        {items.map(({ value, count }) => {
          const isChecked = currentValue === value;
          return (
            <li key={value}>
              <Link
                href={`/cars?${buildParams(searchParams, { [facetKey]: value })}`}
                className="flex items-center gap-3 py-1 cursor-pointer group"
                aria-pressed={isChecked}
              >
                <span
                  className={cn(
                    'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors',
                    isChecked ? 'bg-primary border-primary' : 'bg-white border-border group-hover:border-primary/50'
                  )}
                >
                  {isChecked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </span>
                <span className="text-[15px] text-primary group-hover:text-secondary transition-colors">
                  {value.charAt(0).toUpperCase() + value.slice(1)} ({count})
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FacetList({
  title,
  facetKey,
  currentValue,
  items,
  searchParams,
}: {
  title: string;
  facetKey: string;
  currentValue?: string;
  items: Array<{ value: string; count: number }>;
  searchParams: URLSearchParams;
}) {
  if (!items || items.length === 0) return null;
  return (
    <div className="pb-6 mb-6 border-b border-border">
      <h3 className="text-[18px] font-medium text-primary mb-3">{title}</h3>
      <ul className="space-y-1">
        <li>
          <Link
            href={currentValue ? `/cars?${buildParams(searchParams, { [facetKey]: undefined })}` : '#'}
            className={cn(
              'block py-2 px-3 rounded-[12px] text-[15px] min-h-[44px] flex items-center justify-between',
              !currentValue ? 'bg-secondary/10 text-secondary font-medium' : 'text-primary/90 hover:bg-bg-1'
            )}
          >
            All
          </Link>
        </li>
        {items.map(({ value, count }) => (
          <li key={value}>
            <Link
              href={`/cars?${buildParams(searchParams, { [facetKey]: value })}`}
              className={cn(
                'block py-2 px-3 rounded-[12px] text-[15px] min-h-[44px] flex items-center justify-between',
                currentValue === value ? 'bg-secondary/10 text-secondary font-medium' : 'text-primary/90 hover:bg-bg-1'
              )}
            >
              <span className="capitalize">{value}</span>
              <span className="text-primary/60 text-[13px]">({count})</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Figma-style dropdown: placeholder "Add Make" / "Add Model" / "Add Variant", single selection */
function FilterDropdown({
  title,
  placeholder,
  currentValue,
  items,
  facetKey,
  searchParams,
  disabled,
  clearKeys,
}: {
  title: string;
  placeholder: string;
  currentValue?: string;
  items: Array<{ value: string; count: number }>;
  facetKey: string;
  searchParams: URLSearchParams;
  disabled?: boolean;
  clearKeys?: string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const buildFacetParams = (value?: string) => {
    const updates: Record<string, string | number | undefined> = {
      [facetKey]: value,
    };

    if (clearKeys) {
      clearKeys.forEach((key) => {
        updates[key] = undefined;
      });
    }

    return buildParams(searchParams, updates);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="pb-6 mb-6 border-b border-border" ref={ref}>
      <h3 className="text-[18px] font-medium text-primary mb-3">{title}</h3>
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setOpen((o) => !o)}
          disabled={disabled}
          className={cn(
            'w-full min-h-[44px] px-3 py-2 text-left text-[15px] border border-border rounded-[12px] flex items-center justify-between gap-2 transition-colors',
            disabled ? 'bg-gray-50 text-primary/50 cursor-not-allowed' : 'bg-white text-primary hover:border-primary/50',
            open && 'border-primary ring-1 ring-primary/20'
          )}
        >
          <span className={cn('truncate', !currentValue && 'text-[#818181]')}>
            {currentValue ? currentValue : placeholder}
          </span>
          <ChevronDown className={cn('w-4 h-4 shrink-0', open && 'rotate-180')} />
        </button>
        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-[12px] shadow-[0px_10px_40px_rgba(0,0,0,0.08)] z-50 max-h-60 overflow-y-auto">
            <Link
              href={currentValue ? `/cars?${buildFacetParams()}` : '#'}
              onClick={() => setOpen(false)}
              className={cn(
                'block px-3 py-2.5 text-[15px] min-h-[44px] flex items-center justify-between border-b border-border',
                !currentValue ? 'bg-secondary/10 text-secondary font-medium' : 'text-primary hover:bg-bg-1'
              )}
            >
              All
            </Link>
            {items.map(({ value, count }) => (
              <Link
                key={value}
                href={`/cars?${buildFacetParams(value)}`}
                onClick={() => setOpen(false)}
                className={cn(
                  'block px-3 py-2.5 text-[15px] min-h-[44px] flex items-center justify-between',
                  currentValue === value ? 'bg-secondary/10 text-secondary font-medium' : 'text-primary hover:bg-bg-1'
                )}
              >
                <span className="capitalize">{value}</span>
                <span className="text-primary/60 text-[13px]">({count})</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function FilterSidebar({ currentFilters, facets, className }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [minPrice, setMinPrice] = useState(currentFilters.minPrice?.toString() ?? '');
  const [maxPrice, setMaxPrice] = useState(currentFilters.maxPrice?.toString() ?? '');
  const [minYear, setMinYear] = useState(currentFilters.minYear?.toString() ?? '');
  const [maxYear, setMaxYear] = useState(currentFilters.maxYear?.toString() ?? '');
  const [sliderMin, setSliderMin] = useState(
    currentFilters.minPrice ?? PRICE_MIN
  );
  const [sliderMax, setSliderMax] = useState(
    currentFilters.maxPrice ?? PRICE_MAX
  );

  useEffect(() => {
    const min = currentFilters.minPrice ?? PRICE_MIN;
    const max = currentFilters.maxPrice ?? PRICE_MAX;
    setSliderMin(min);
    setSliderMax(max);
    if (currentFilters.minPrice == null) setMinPrice('');
    else setMinPrice(String(currentFilters.minPrice));
    if (currentFilters.maxPrice == null) setMaxPrice('');
    else setMaxPrice(String(currentFilters.maxPrice));
  }, [currentFilters.minPrice, currentFilters.maxPrice]);

  const applyRangeFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (minPrice) params.set('minPrice', minPrice);
    else params.delete('minPrice');
    if (maxPrice) params.set('maxPrice', maxPrice);
    else params.delete('maxPrice');
    if (minYear) params.set('minYear', minYear);
    else params.delete('minYear');
    if (maxYear) params.set('maxYear', maxYear);
    else params.delete('maxYear');
    router.push(`/cars?${params.toString()}`);
  };

  const handleSliderMin = (v: number) => {
    const val = Math.min(v, sliderMax - PRICE_STEP);
    setSliderMin(val);
    setMinPrice(String(val));
  };

  const handleSliderMax = (v: number) => {
    const val = Math.max(v, sliderMin + PRICE_STEP);
    setSliderMax(val);
    setMaxPrice(String(val));
  };

  const hasActiveFilters =
    currentFilters.make ||
    currentFilters.model ||
    currentFilters.variant ||
    currentFilters.minPrice != null ||
    currentFilters.maxPrice != null ||
    currentFilters.minYear != null ||
    currentFilters.maxYear != null ||
    currentFilters.transmission ||
    currentFilters.fuelType ||
    currentFilters.bodyType ||
    currentFilters.condition;

  const fillLeft = ((sliderMin - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  const fillWidth = ((sliderMax - sliderMin) / (PRICE_MAX - PRICE_MIN)) * 100;

  return (
    <aside
      className={cn(
        'bg-white border border-border rounded-[16px] p-5 shadow-card',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[18px] font-medium text-primary">Filters</h2>
        {hasActiveFilters && (
          <Link href="/cars" className="text-[14px] text-secondary font-medium hover:underline">
            Clear all
          </Link>
        )}
      </div>

      {/* AI-Powered Natural Language Search */}
      <div className="pb-6 mb-6 border-b border-border">
        <AISearchBar 
          placeholder='Try "SUVs under R300k"'
          className="w-full"
        />
        <p className="mt-2 text-[13px] text-primary/60 text-center">
          or use filters below
        </p>
      </div>

      {/* Figma order: Condition, Type, Make, Model, Variant, Year, Price, Transmission, Fuel Type */}

      <FacetList
        title="Condition"
        facetKey="condition"
        currentValue={currentFilters.condition}
        items={facets.condition ?? []}
        searchParams={searchParams}
      />

      <FacetCheckboxList
        title="Type"
        facetKey="bodyType"
        currentValue={currentFilters.bodyType}
        items={facets.body_type ?? []}
        searchParams={searchParams}
      />

      <FilterDropdown
        title="Make"
        placeholder="Add Make"
        currentValue={currentFilters.make}
        items={facets.make ?? []}
        facetKey="make"
        searchParams={searchParams}
        clearKeys={['model', 'variant']}
      />
      <FilterDropdown
        title="Model"
        placeholder="Add Model"
        currentValue={currentFilters.model}
        items={facets.model ?? []}
        facetKey="model"
        searchParams={searchParams}
        clearKeys={['variant']}
        disabled={!currentFilters.make}
      />
      <FilterDropdown
        title="Variant"
        placeholder="Add Variant"
        currentValue={currentFilters.variant}
        items={facets.variant ?? []}
        facetKey="variant"
        searchParams={searchParams}
        disabled={!currentFilters.make || !currentFilters.model}
      />

      {/* Year range */}
      <div className="pb-6 mb-6 border-b border-border">
        <h3 className="text-[18px] font-medium text-primary mb-3">Year</h3>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            min={1990}
            max={2030}
            value={minYear}
            onChange={(e) => setMinYear(e.target.value)}
            className="w-full h-[60px] px-3 py-2 text-[15px] border border-border rounded-button focus:outline-none focus:border-secondary text-primary"
          />
          <span className="text-primary/60">–</span>
          <input
            type="number"
            placeholder="Max"
            min={1990}
            max={2030}
            value={maxYear}
            onChange={(e) => setMaxYear(e.target.value)}
            className="w-full h-[60px] px-3 py-2 text-[15px] border border-border rounded-button focus:outline-none focus:border-secondary text-primary"
          />
        </div>
        <button
          type="button"
          onClick={applyRangeFilters}
          className="mt-2 w-full min-h-[44px] px-4 py-2 text-[14px] font-medium text-secondary border border-secondary rounded-[12px] hover:bg-secondary/5 transition-colors"
        >
          Apply year
        </button>
      </div>

      {/* Price */}
      <div className="pb-6 mb-6 border-b border-border">
        <h3 className="text-[18px] font-medium text-primary mb-3">Price</h3>
        <div className="flex gap-2 items-center mb-3">
          <input
            type="number"
            placeholder="Min price"
            value={minPrice}
            onChange={(e) => {
              setMinPrice(e.target.value);
              const n = parseInt(e.target.value, 10);
              if (!Number.isNaN(n)) setSliderMin(Math.max(PRICE_MIN, Math.min(n, sliderMax - PRICE_STEP)));
            }}
            className="w-full h-[60px] px-3 py-2 text-[15px] border border-border rounded-button focus:outline-none focus:border-secondary text-primary placeholder:text-[#818181]"
          />
          <span className="text-primary/60 shrink-0">–</span>
          <input
            type="number"
            placeholder="Max price"
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value);
              const n = parseInt(e.target.value, 10);
              if (!Number.isNaN(n)) setSliderMax(Math.min(PRICE_MAX, Math.max(n, sliderMin + PRICE_STEP)));
            }}
            className="w-full h-[60px] px-3 py-2 text-[15px] border border-border rounded-button focus:outline-none focus:border-secondary text-primary placeholder:text-[#818181]"
          />
        </div>
        <div className="relative h-3 rounded-[30px] bg-border mt-1">
          <div
            className="absolute h-full rounded-[30px] bg-primary"
            style={{ left: `${fillLeft}%`, width: `${fillWidth}%` }}
          />
        </div>
        <div className="flex flex-col gap-2 mt-2">
          <input
            type="range"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={PRICE_STEP}
            value={sliderMin}
            onChange={(e) => handleSliderMin(Number(e.target.value))}
            className="w-full h-3 accent-primary"
            aria-label="Min price"
          />
          <input
            type="range"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={PRICE_STEP}
            value={sliderMax}
            onChange={(e) => handleSliderMax(Number(e.target.value))}
            className="w-full h-3 accent-primary"
            aria-label="Max price"
          />
        </div>
        <button
          type="button"
          onClick={applyRangeFilters}
          className="mt-3 w-full min-h-[44px] px-4 py-2 text-[14px] font-medium text-secondary border border-secondary rounded-[12px] hover:bg-secondary/5 transition-colors"
        >
          Apply price
        </button>
      </div>

      <FacetCheckboxList
        title="Transmission"
        facetKey="transmission"
        currentValue={currentFilters.transmission}
        items={facets.transmission ?? []}
        searchParams={searchParams}
      />
      <FacetCheckboxList
        title="Fuel Type"
        facetKey="fuelType"
        currentValue={currentFilters.fuelType}
        items={facets.fuel_type ?? []}
        searchParams={searchParams}
      />

      {/* Prominent Search Button */}
      <button
        type="button"
        onClick={applyRangeFilters}
        className="w-full min-h-[44px] px-6 py-3 text-[15px] font-medium text-white bg-secondary rounded-[12px] hover:bg-secondary/90 transition-colors"
      >
        Search
      </button>
    </aside>
  );
}
