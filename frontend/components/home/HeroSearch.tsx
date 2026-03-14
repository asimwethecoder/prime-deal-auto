'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/ui/Icon';
import { getSearchFacets, getSearchSuggestions } from '@/lib/api/search';

const BODY_TYPES: Array<{ label: string; icon?: string; query: string }> = [
  { label: 'SUV', icon: 'suv-transportation-car-suv-svgrepo-com.svg', query: 'SUV' },
  { label: 'Bakkie', icon: 'backie-svgrepo-com.svg', query: 'Bakkie' },
  { label: 'Sedan', icon: 'sedan-2-svgrepo-com.svg', query: 'Sedan' },
  { label: 'Hatchback', icon: 'car-hatchback-automobile-2-svgrepo-com.svg', query: 'Hatchback' },
];

const PRICE_STEP = 50_000;

function formatPrice(n: number): string {
  if (n >= 1_000_000) return `R ${n / 1_000_000}M`;
  if (n >= 1_000) return `R ${n / 1_000}k`;
  return `R ${n}`;
}

function buildPriceOptions(min: number, max: number): Array<{ value: number | null; label: string }> {
  const options: Array<{ value: number | null; label: string }> = [{ value: null, label: 'Any' }];
  for (let p = min; p <= max; p += PRICE_STEP) {
    options.push({ value: p, label: formatPrice(p) });
  }
  return options;
}

interface HeroSearchProps {
  totalCount?: number;
}

type DropdownKey = 'make' | 'model' | 'variant' | 'minPrice' | 'maxPrice' | null;

export function HeroSearch({ totalCount = 0 }: HeroSearchProps) {
  const [make, setMake] = useState<string>('Makes');
  const [model, setModel] = useState<string>('Models');
  const [variant, setVariant] = useState<string>('Variants');
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: facets, isLoading: facetsLoading } = useQuery({
    queryKey: ['search-facets'],
    queryFn: () => getSearchFacets(),
    staleTime: 60_000,
  });

  const makeValue = make === 'Any Makes' ? '' : make;
  const { data: modelSuggestions } = useQuery({
    queryKey: ['search-suggestions', 'model', makeValue],
    queryFn: () => getSearchSuggestions(makeValue, 'model'),
    enabled: !!makeValue,
    staleTime: 30_000,
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchButtonText = totalCount > 0 ? `Search ${totalCount} Cars` : 'Search Cars';

  const makeOptions = facets?.make ?? [];
  const variantOptions = facets?.body_type ?? [];
  const priceRange = { min: 0, max: 500_000 };
  const minPriceOptions = buildPriceOptions(priceRange.min, priceRange.max);
  const maxPriceOptions = buildPriceOptions(priceRange.min, priceRange.max);

  const minPriceLabel = minPrice == null ? 'Min Price' : formatPrice(minPrice);
  const maxPriceLabel = maxPrice == null ? 'Max Price' : formatPrice(maxPrice);

  const searchParams = new URLSearchParams();
  if (make !== 'Any Makes') searchParams.set('make', make);
  if (model !== 'Any Models') searchParams.set('model', model);
  if (variant !== 'Any Variants') searchParams.set('bodyType', variant);
  if (minPrice != null) searchParams.set('minPrice', String(minPrice));
  if (maxPrice != null) searchParams.set('maxPrice', String(maxPrice));
  const searchHref = `/cars?${searchParams.toString()}`;

  function open(key: DropdownKey) {
    setOpenDropdown((prev) => (prev === key ? null : key));
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Pill: single continuous bar, divide-x for segment dividers (no gap) */}
      <div className="flex flex-nowrap items-stretch divide-x divide-slate-200 bg-white rounded-full shadow-lg min-h-[56px] overflow-x-auto overflow-y-visible" ref={dropdownRef}>
        {/* Make - rounded-l-full for pill left edge */}
        <div className="flex-1 min-w-0 relative rounded-l-full bg-white">
          <button
            type="button"
            onClick={() => open('make')}
            className="w-full h-full flex items-center gap-2 px-3 sm:px-4 py-3 text-left text-primary text-[15px] truncate hover:bg-bg-1 transition-colors cursor-pointer rounded-l-full"
          >
            <span className="truncate">{make}</span>
            <Icon src="chevron-down-double-svgrepo-com.svg" width={16} height={16} className="shrink-0 ml-auto" aria-hidden />
          </button>
          {openDropdown === 'make' && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-card shadow-card z-[100] max-h-60 overflow-y-auto">
              <button
                type="button"
                onClick={() => { setMake('Any Makes'); setOpenDropdown(null); }}
                className="block w-full px-4 py-3 text-left text-[15px] hover:bg-bg-1 text-primary"
              >
                Any Makes
              </button>
              {facetsLoading ? (
                <div className="px-4 py-3 text-[15px] text-gray-500">Loading...</div>
              ) : (
                makeOptions.map((item: { value: string; count: number }) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => { setMake(item.value); setOpenDropdown(null); }}
                    className="block w-full px-4 py-3 text-left text-[15px] hover:bg-bg-1 text-primary"
                  >
                    {item.value}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Model */}
        <div className="flex-1 min-w-0 relative bg-white">
          <button
            type="button"
            onClick={() => open('model')}
            className="w-full h-full flex items-center gap-2 px-3 sm:px-4 py-3 text-left text-primary text-[15px] truncate hover:bg-bg-1 transition-colors cursor-pointer"
          >
            <span className="truncate">{model}</span>
            <Icon src="chevron-down-double-svgrepo-com.svg" width={16} height={16} className="shrink-0 ml-auto" aria-hidden />
          </button>
          {openDropdown === 'model' && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-card shadow-card z-[100] max-h-60 overflow-y-auto">
              <button
                type="button"
                onClick={() => { setModel('Any Models'); setOpenDropdown(null); }}
                className="block w-full px-4 py-3 text-left text-[15px] hover:bg-bg-1 text-primary"
              >
                Any Models
              </button>
              {(modelSuggestions ?? []).map(({ text }) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => { setModel(text); setOpenDropdown(null); }}
                  className="block w-full px-4 py-3 text-left text-[15px] hover:bg-bg-1 text-primary"
                >
                  {text}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Variant (body type) */}
        <div className="flex-1 min-w-0 relative bg-white">
          <button
            type="button"
            onClick={() => open('variant')}
            className="w-full h-full flex items-center gap-2 px-3 sm:px-4 py-3 text-left text-primary text-[15px] truncate hover:bg-bg-1 transition-colors cursor-pointer"
          >
            <span className="truncate">{variant}</span>
            <Icon src="chevron-down-double-svgrepo-com.svg" width={16} height={16} className="shrink-0 ml-auto" aria-hidden />
          </button>
          {openDropdown === 'variant' && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-card shadow-card z-[100] max-h-60 overflow-y-auto">
              <button
                type="button"
                onClick={() => { setVariant('Any Variants'); setOpenDropdown(null); }}
                className="block w-full px-4 py-3 text-left text-[15px] hover:bg-bg-1 text-primary"
              >
                Any Variants
              </button>
              {variantOptions.map((item: { value: string; count: number }) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => { setVariant(item.value); setOpenDropdown(null); }}
                  className="block w-full px-4 py-3 text-left text-[15px] hover:bg-bg-1 text-primary"
                >
                  {item.value}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Min Price */}
        <div className="flex-1 min-w-0 relative bg-white">
          <button
            type="button"
            onClick={() => open('minPrice')}
            className="w-full h-full flex items-center gap-2 px-3 sm:px-4 py-3 text-left text-primary text-[15px] truncate hover:bg-bg-1 transition-colors cursor-pointer"
          >
            <span className="truncate">{minPriceLabel}</span>
            <Icon src="chevron-down-double-svgrepo-com.svg" width={16} height={16} className="shrink-0 ml-auto" aria-hidden />
          </button>
          {openDropdown === 'minPrice' && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-card shadow-card z-50 max-h-60 overflow-y-auto">
              {minPriceOptions.map(({ value, label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => { setMinPrice(value); setOpenDropdown(null); }}
                  className="block w-full px-4 py-3 text-left text-[15px] hover:bg-bg-1 text-primary"
                >
                  {value == null ? 'Min Price' : label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Max Price */}
        <div className="flex-1 min-w-0 relative bg-white">
          <button
            type="button"
            onClick={() => open('maxPrice')}
            className="w-full h-full flex items-center gap-2 px-3 sm:px-4 py-3 text-left text-primary text-[15px] truncate hover:bg-bg-1 transition-colors cursor-pointer"
          >
            <span className="truncate">{maxPriceLabel}</span>
            <Icon src="chevron-down-double-svgrepo-com.svg" width={16} height={16} className="shrink-0 ml-auto" aria-hidden />
          </button>
          {openDropdown === 'maxPrice' && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-card shadow-card z-[100] max-h-60 overflow-y-auto">
              {maxPriceOptions.map(({ value, label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => { setMaxPrice(value); setOpenDropdown(null); }}
                  className="block w-full px-4 py-3 text-left text-[15px] hover:bg-bg-1 text-primary"
                >
                  {value == null ? 'Max Price' : label}
                </button>
              ))}
            </div>
          )}
        </div>

        <Link
          href={searchHref}
          className="flex items-center justify-center gap-2 bg-secondary text-white px-5 py-3 rounded-r-full font-medium text-[14px] hover:bg-secondary/90 transition-colors shrink-0 min-w-[120px]"
        >
          <Icon src="search-alt-2-svgrepo-com.svg" width={18} height={18} className="invert shrink-0" aria-hidden />
          <span className="whitespace-nowrap">{searchButtonText}</span>
        </Link>
      </div>

      {/* Or Browse Featured Model - body type icons (capsule: icon + label horizontal) */}
      <p className="text-white/90 text-[14px] mt-8 mb-5 text-center">Or Browse Featured Model</p>
      <div className="flex flex-wrap justify-center gap-3">
        {BODY_TYPES.map(({ label, icon, query }) => (
          <Link
            key={label}
            href={`/cars?bodyType=${encodeURIComponent(query)}`}
            className="flex flex-row items-center gap-2 h-10 px-3 py-2 bg-white/10 backdrop-blur-md border-[0.5px] border-white/20 hover:bg-white/20 text-white text-xs font-medium rounded-full transition-colors"
          >
            {icon ? (
              <Icon
                src={icon}
                width={20}
                height={20}
                className="invert shrink-0 w-5 h-5"
                aria-hidden
              />
            ) : (
              <span className="text-white text-lg leading-none">—</span>
            )}
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
