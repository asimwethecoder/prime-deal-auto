'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { getSearchFacets } from '@/lib/api/search';
import { cn } from '@/lib/utils/cn';

const BODY_TYPES: Array<{ label: string; icon?: string; query: string }> = [
  { label: 'SUV', icon: 'suv-transportation-car-suv-svgrepo-com', query: 'SUV' },
  { label: 'Bakkie', icon: 'backie-svgrepo-com', query: 'Bakkie' },
  { label: 'Sedan', icon: 'sedan-2-svgrepo-com', query: 'Sedan' },
  { label: 'Hatchback', icon: 'car-hatchback-automobile-2-svgrepo-com', query: 'Hatchback' },
];

const PRICE_STEP = 50_000;

function formatPrice(n: number): string {
  if (n >= 1_000_000) return `R${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `R${Math.round(n / 1_000)}k`;
  return `R${n.toLocaleString('en-ZA')}`;
}

function buildPriceOptions(min: number, max: number): Array<{ value: number | null; label: string }> {
  const options: Array<{ value: number | null; label: string }> = [{ value: null, label: 'Any Price' }];
  for (let p = min; p <= max; p += PRICE_STEP) {
    options.push({ value: p, label: formatPrice(p) });
  }
  return options;
}

interface EnhancedHeroSearchProps {
  totalCount?: number;
}

type DropdownKey = 'make' | 'model' | 'variant' | 'minPrice' | 'maxPrice' | null;

export function EnhancedHeroSearch({ totalCount = 0 }: EnhancedHeroSearchProps) {
  const [selectedMake, setSelectedMake] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch facets for makes (no filter params for hero)
  const { data: facets, isLoading: facetsLoading } = useQuery({
    queryKey: ['search-facets'],
    queryFn: () => getSearchFacets(),
    staleTime: 60_000,
  });

  // Fetch model facets when make is selected
  const { data: modelFacets, isLoading: modelsLoading } = useQuery({
    queryKey: ['search-facets', selectedMake],
    queryFn: () => getSearchFacets({ make: selectedMake }),
    enabled: !!selectedMake,
    staleTime: 30_000,
  });

  // Fetch variant facets when make and model are selected
  const { data: variantFacets, isLoading: variantsLoading } = useQuery({
    queryKey: ['search-facets', selectedMake, selectedModel],
    queryFn: () => getSearchFacets({ make: selectedMake, model: selectedModel }),
    enabled: !!selectedMake && !!selectedModel,
    staleTime: 30_000,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset dependent selections when parent changes
  useEffect(() => {
    if (selectedMake) {
      setSelectedModel('');
      setSelectedVariant('');
    }
  }, [selectedMake]);

  useEffect(() => {
    if (selectedModel) {
      setSelectedVariant('');
    }
  }, [selectedModel]);

  const makeOptions = facets?.make ?? [];
  const priceRange = { min: 0, max: 2_000_000 };
  const minPriceOptions = buildPriceOptions(priceRange.min, priceRange.max);
  const maxPriceOptions = buildPriceOptions(priceRange.min, priceRange.max);

  const searchButtonText = totalCount > 0 ? `Search ${totalCount.toLocaleString('en-ZA')} Cars` : 'Search Cars';

  // Build search URL
  const searchParams = new URLSearchParams();
  if (selectedMake) searchParams.set('make', selectedMake);
  if (selectedModel) searchParams.set('model', selectedModel);
  if (selectedVariant) searchParams.set('variant', selectedVariant);
  if (minPrice != null) searchParams.set('minPrice', String(minPrice));
  if (maxPrice != null) searchParams.set('maxPrice', String(maxPrice));
  const searchHref = `/cars?${searchParams.toString()}`;

  function toggleDropdown(key: DropdownKey) {
    setOpenDropdown(prev => prev === key ? null : key);
  }

  function handleMakeSelect(make: string) {
    setSelectedMake(make);
    setOpenDropdown(null);
  }

  function handleModelSelect(model: string) {
    setSelectedModel(model);
    setOpenDropdown(null);
  }

  function handleVariantSelect(variant: string) {
    setSelectedVariant(variant);
    setOpenDropdown(null);
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Enhanced Search Bar with Cascading Dropdowns */}
      <div className="relative" ref={dropdownRef}>
        <div className="flex flex-col md:flex-row md:flex-nowrap items-stretch gap-3 md:gap-0 md:divide-x divide-slate-200 bg-white rounded-[12px] md:rounded-full shadow-[0px_10px_40px_rgba(0,0,0,0.05)] md:shadow-lg min-h-0 md:min-h-[56px] p-3 md:p-0">
          
          {/* Make Dropdown - 12px radius on mobile */}
          <div className="flex-1 min-w-0 relative rounded-[12px] md:rounded-l-full bg-white border border-slate-200 md:border-0">
            <button
              type="button"
              onClick={() => toggleDropdown('make')}
              className="w-full h-full min-h-[48px] flex items-center gap-2 px-3 sm:px-4 py-3 text-left text-[#050B20] text-[15px] truncate hover:bg-[#F9FBFC] transition-colors cursor-pointer rounded-[12px] md:rounded-l-full"
            >
              <span className="truncate font-normal">
                {selectedMake || 'Makes'}
              </span>
              <DynamicIcon 
                name="chevron-down" 
                width={16} 
                height={16} 
                className="shrink-0 ml-auto text-[#050B20]" 
              />
            </button>
            
            {openDropdown === 'make' && (
              <div className="absolute top-full left-0 mt-2 w-[231px] bg-white rounded-[24px] shadow-[0px_10px_40px_rgba(0,0,0,0.05)] z-[100] max-h-80 overflow-y-auto">
                <div className="py-2">
                  <button
                    type="button"
                    onClick={() => handleMakeSelect('')}
                    className={cn(
                      "block w-full px-4 py-2 text-left text-[15px] leading-[35px] text-[#050B20] hover:bg-[#EEF1FB] transition-colors",
                      !selectedMake && "bg-[#EEF1FB]"
                    )}
                  >
                    All Makes
                  </button>
                  {facetsLoading ? (
                    <div className="px-4 py-2 text-[15px] leading-[35px] text-gray-500">Loading...</div>
                  ) : (
                    makeOptions.map((item: { value: string; count: number }) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => handleMakeSelect(item.value)}
                        className={cn(
                          "block w-full px-4 py-2 text-left text-[15px] leading-[35px] text-[#050B20] hover:bg-[#EEF1FB] transition-colors",
                          selectedMake === item.value && "bg-[#EEF1FB]"
                        )}
                      >
                        {item.value}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Model Dropdown - 12px radius on mobile */}
          <div className="flex-1 min-w-0 relative bg-white border border-slate-200 md:border-0 rounded-[12px] md:rounded-none">
            <button
              type="button"
              onClick={() => toggleDropdown('model')}
              disabled={!selectedMake}
              className={cn(
                "w-full h-full min-h-[48px] flex items-center gap-2 px-3 sm:px-4 py-3 text-left text-[15px] truncate transition-colors cursor-pointer rounded-[12px] md:rounded-none",
                selectedMake 
                  ? "text-[#050B20] hover:bg-[#F9FBFC]" 
                  : "text-gray-400 cursor-not-allowed"
              )}
            >
              <span className="truncate font-normal">
                {selectedModel || 'Models'}
              </span>
              <DynamicIcon 
                name="chevron-down" 
                width={16} 
                height={16} 
                className={cn(
                  "shrink-0 ml-auto",
                  selectedMake ? "text-[#050B20]" : "text-gray-400"
                )} 
              />
            </button>
            
            {openDropdown === 'model' && selectedMake && (
              <div className="absolute top-full left-0 mt-2 w-[231px] bg-white rounded-[24px] shadow-[0px_10px_40px_rgba(0,0,0,0.05)] z-[100] max-h-80 overflow-y-auto">
                <div className="py-2">
                  <button
                    type="button"
                    onClick={() => handleModelSelect('')}
                    className={cn(
                      "block w-full px-4 py-2 text-left text-[15px] leading-[35px] text-[#050B20] hover:bg-[#EEF1FB] transition-colors",
                      !selectedModel && "bg-[#EEF1FB]"
                    )}
                  >
                    All Models
                  </button>
                  {modelsLoading ? (
                    <div className="px-4 py-2 text-[15px] leading-[35px] text-gray-500">Loading...</div>
                  ) : (
                    (modelFacets?.model ?? []).map((item: { value: string; count: number }) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => handleModelSelect(item.value)}
                        className={cn(
                          "block w-full px-4 py-2 text-left text-[15px] leading-[35px] text-[#050B20] hover:bg-[#EEF1FB] transition-colors",
                          selectedModel === item.value && "bg-[#EEF1FB]"
                        )}
                      >
                        {item.value}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Variant Dropdown */}
          <div className="flex-1 min-w-0 relative bg-white border border-slate-200 md:border-0 rounded-xl md:rounded-none">
            <button
              type="button"
              onClick={() => toggleDropdown('variant')}
              disabled={!selectedMake || !selectedModel}
              className={cn(
                "w-full h-full min-h-[48px] flex items-center gap-2 px-3 sm:px-4 py-3 text-left text-[15px] truncate transition-colors cursor-pointer rounded-[12px] md:rounded-none",
                (selectedMake && selectedModel)
                  ? "text-[#050B20] hover:bg-[#F9FBFC]" 
                  : "text-gray-400 cursor-not-allowed"
              )}
            >
              <span className="truncate font-normal">
                {selectedVariant || 'Variants'}
              </span>
              <DynamicIcon 
                name="chevron-down" 
                width={16} 
                height={16} 
                className={cn(
                  "shrink-0 ml-auto",
                  (selectedMake && selectedModel) ? "text-[#050B20]" : "text-gray-400"
                )} 
              />
            </button>
            
            {openDropdown === 'variant' && selectedMake && selectedModel && (
              <div className="absolute top-full left-0 mt-2 w-[231px] bg-white rounded-[24px] shadow-[0px_10px_40px_rgba(0,0,0,0.05)] z-[100] max-h-80 overflow-y-auto">
                <div className="py-2">
                  <button
                    type="button"
                    onClick={() => handleVariantSelect('')}
                    className={cn(
                      "block w-full px-4 py-2 text-left text-[15px] leading-[35px] text-[#050B20] hover:bg-[#EEF1FB] transition-colors",
                      !selectedVariant && "bg-[#EEF1FB]"
                    )}
                  >
                    All Variants
                  </button>
                  {variantsLoading ? (
                    <div className="px-4 py-2 text-[15px] leading-[35px] text-gray-500">Loading...</div>
                  ) : (
                    (variantFacets?.variant ?? []).map((item: { value: string; count: number }) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => handleVariantSelect(item.value)}
                        className={cn(
                          "block w-full px-4 py-2 text-left text-[15px] leading-[35px] text-[#050B20] hover:bg-[#EEF1FB] transition-colors",
                          selectedVariant === item.value && "bg-[#EEF1FB]"
                        )}
                      >
                        {item.value}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Min Price Dropdown */}
          <div className="flex-1 min-w-0 relative bg-white border border-slate-200 md:border-0 rounded-xl md:rounded-none">
            <button
              type="button"
              onClick={() => toggleDropdown('minPrice')}
              className="w-full h-full min-h-[48px] flex items-center gap-2 px-3 sm:px-4 py-3 text-left text-[#050B20] text-[15px] truncate hover:bg-[#F9FBFC] transition-colors cursor-pointer rounded-[12px] md:rounded-none"
            >
              <span className="truncate font-normal">
                {minPrice ? formatPrice(minPrice) : 'Min Price'}
              </span>
              <DynamicIcon 
                name="chevron-down" 
                width={16} 
                height={16} 
                className="shrink-0 ml-auto text-[#050B20]" 
              />
            </button>
            
            {openDropdown === 'minPrice' && (
              <div className="absolute top-full left-0 mt-2 w-[231px] bg-white rounded-[24px] shadow-[0px_10px_40px_rgba(0,0,0,0.05)] z-[100] max-h-80 overflow-y-auto">
                <div className="py-2">
                  {minPriceOptions.map(({ value, label }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => { setMinPrice(value); setOpenDropdown(null); }}
                      className={cn(
                        "block w-full px-4 py-2 text-left text-[15px] leading-[35px] text-[#050B20] hover:bg-[#EEF1FB] transition-colors",
                        minPrice === value && "bg-[#EEF1FB]"
                      )}
                    >
                      {value === null ? 'Any Price' : label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Max Price Dropdown */}
          <div className="flex-1 min-w-0 relative bg-white border border-slate-200 md:border-0 rounded-xl md:rounded-none">
            <button
              type="button"
              onClick={() => toggleDropdown('maxPrice')}
              className="w-full h-full min-h-[48px] flex items-center gap-2 px-3 sm:px-4 py-3 text-left text-[#050B20] text-[15px] truncate hover:bg-[#F9FBFC] transition-colors cursor-pointer rounded-[12px] md:rounded-none"
            >
              <span className="truncate font-normal">
                {maxPrice ? formatPrice(maxPrice) : 'Max Price'}
              </span>
              <DynamicIcon 
                name="chevron-down" 
                width={16} 
                height={16} 
                className="shrink-0 ml-auto text-[#050B20]" 
              />
            </button>
            
            {openDropdown === 'maxPrice' && (
              <div className="absolute top-full left-0 mt-2 w-[231px] bg-white rounded-[24px] shadow-[0px_10px_40px_rgba(0,0,0,0.05)] z-[100] max-h-80 overflow-y-auto">
                <div className="py-2">
                  {maxPriceOptions.map(({ value, label }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => { setMaxPrice(value); setOpenDropdown(null); }}
                      className={cn(
                        "block w-full px-4 py-2 text-left text-[15px] leading-[35px] text-[#050B20] hover:bg-[#EEF1FB] transition-colors",
                        maxPrice === value && "bg-[#EEF1FB]"
                      )}
                    >
                      {value === null ? 'Any Price' : label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Search Button - Pill style (desktop), 54px height */}
          <Link
            href={searchHref}
            className="flex items-center justify-center gap-2 bg-[#405FF2] text-white px-6 py-3 min-h-[54px] rounded-[120px] font-medium text-[15px] hover:bg-[#3651E0] transition-colors shrink-0 min-w-[140px] max-md:hidden"
          >
            <DynamicIcon 
              name="search-alt-2-svgrepo-com" 
              width={18} 
              height={18} 
              className="shrink-0 text-white" 
            />
            <span className="whitespace-nowrap">{searchButtonText}</span>
          </Link>
        </div>

        {/* Mobile Search Button - Full width, 54px height, #405FF2, 12px radius */}
        <Link
          href={searchHref}
          className="md:hidden flex items-center justify-center gap-2 bg-[#405FF2] text-white w-full min-h-[54px] mt-3 rounded-[12px] font-medium text-[15px] hover:bg-[#3651E0] transition-colors"
        >
          <DynamicIcon 
            name="search-alt-2-svgrepo-com" 
            width={18} 
            height={18} 
            className="shrink-0 text-white" 
          />
          <span className="whitespace-nowrap">{searchButtonText}</span>
        </Link>
      </div>

      {/* Body Type Quick Filters */}
      <p className="text-white/90 text-[14px] mt-8 mb-5 text-center font-normal">Or Browse Featured Model</p>
      <div className="flex flex-wrap justify-center gap-3">
        {BODY_TYPES.map(({ label, icon, query }) => (
          <motion.div
            key={label}
            whileHover={{ scale: 1.1, rotate: [0, -5, 5, -5, 0] }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="pointer-fine:cursor-pointer"
          >
            <Link
              href={`/cars?bodyType=${encodeURIComponent(query)}`}
              className="flex flex-row items-center gap-2 h-10 px-3 py-2 bg-white/10 backdrop-blur-md border-[0.5px] border-white/20 hover:bg-white/20 text-white text-xs font-medium rounded-full transition-colors"
              data-cursor-magnetic
            >
              {icon && (
                <DynamicIcon
                  name={icon}
                  width={20}
                  height={20}
                  className="shrink-0 w-5 h-5 text-white"
                />
              )}
              <span>{label}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}