'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { getSearchFacets, getModelsForMake, getVariantsForModel } from '@/lib/api/search';
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

  // Fetch models when make is selected
  const { data: models, isLoading: modelsLoading } = useQuery({
    queryKey: ['models-for-make', selectedMake],
    queryFn: () => getModelsForMake(selectedMake),
    enabled: !!selectedMake,
    staleTime: 30_000,
  });

  // Fetch variants when make and model are selected
  const { data: variants, isLoading: variantsLoading } = useQuery({
    queryKey: ['variants-for-model', selectedMake, selectedModel],
    queryFn: () => getVariantsForModel(selectedMake, selectedModel),
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
        <div className="flex flex-nowrap items-stretch divide-x divide-slate-200 bg-white rounded-full shadow-lg min-h-[56px] overflow-x-auto overflow-y-visible">
          
          {/* Make Dropdown */}
          <div className="flex-1 min-w-0 relative rounded-l-full bg-white">
            <button
              type="button"
              onClick={() => toggleDropdown('make')}
              className="w-full h-full flex items-center gap-2 px-3 sm:px-4 py-3 text-left text-[#050B20] text-[15px] truncate hover:bg-[#F9FBFC] transition-colors cursor-pointer rounded-l-full"
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

          {/* Model Dropdown */}
          <div className="flex-1 min-w-0 relative bg-white">
            <button
              type="button"
              onClick={() => toggleDropdown('model')}
              disabled={!selectedMake}
              className={cn(
                "w-full h-full flex items-center gap-2 px-3 sm:px-4 py-3 text-left text-[15px] truncate transition-colors cursor-pointer",
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
                    (models ?? []).map(({ text }) => (
                      <button
                        key={text}
                        type="button"
                        onClick={() => handleModelSelect(text)}
                        className={cn(
                          "block w-full px-4 py-2 text-left text-[15px] leading-[35px] text-[#050B20] hover:bg-[#EEF1FB] transition-colors",
                          selectedModel === text && "bg-[#EEF1FB]"
                        )}
                      >
                        {text}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Variant Dropdown */}
          <div className="flex-1 min-w-0 relative bg-white">
            <button
              type="button"
              onClick={() => toggleDropdown('variant')}
              disabled={!selectedMake || !selectedModel}
              className={cn(
                "w-full h-full flex items-center gap-2 px-3 sm:px-4 py-3 text-left text-[15px] truncate transition-colors cursor-pointer",
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
                    (variants ?? []).map(({ text }) => (
                      <button
                        key={text}
                        type="button"
                        onClick={() => handleVariantSelect(text)}
                        className={cn(
                          "block w-full px-4 py-2 text-left text-[15px] leading-[35px] text-[#050B20] hover:bg-[#EEF1FB] transition-colors",
                          selectedVariant === text && "bg-[#EEF1FB]"
                        )}
                      >
                        {text}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Min Price Dropdown */}
          <div className="flex-1 min-w-0 relative bg-white">
            <button
              type="button"
              onClick={() => toggleDropdown('minPrice')}
              className="w-full h-full flex items-center gap-2 px-3 sm:px-4 py-3 text-left text-[#050B20] text-[15px] truncate hover:bg-[#F9FBFC] transition-colors cursor-pointer"
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
          <div className="flex-1 min-w-0 relative bg-white">
            <button
              type="button"
              onClick={() => toggleDropdown('maxPrice')}
              className="w-full h-full flex items-center gap-2 px-3 sm:px-4 py-3 text-left text-[#050B20] text-[15px] truncate hover:bg-[#F9FBFC] transition-colors cursor-pointer"
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

          {/* Search Button */}
          <Link
            href={searchHref}
            className="flex items-center justify-center gap-2 bg-[#405FF2] text-white px-5 py-3 rounded-r-full font-medium text-[14px] hover:bg-[#3651E0] transition-colors shrink-0 min-w-[120px]"
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
      </div>

      {/* Body Type Quick Filters */}
      <p className="text-white/90 text-[14px] mt-8 mb-5 text-center font-normal">Or Browse Featured Model</p>
      <div className="flex flex-wrap justify-center gap-3">
        {BODY_TYPES.map(({ label, icon, query }) => (
          <Link
            key={label}
            href={`/cars?bodyType=${encodeURIComponent(query)}`}
            className="flex flex-row items-center gap-2 h-10 px-3 py-2 bg-white/10 backdrop-blur-md border-[0.5px] border-white/20 hover:bg-white/20 text-white text-xs font-medium rounded-full transition-colors"
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
        ))}
      </div>
    </div>
  );
}