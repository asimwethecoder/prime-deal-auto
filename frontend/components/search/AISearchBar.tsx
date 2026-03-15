'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { parseSearchIntent, ParsedIntentFilters } from '@/lib/api/search';

const FOCUS_HERO_SEARCH = 'focus-hero-search';

interface AISearchBarProps {
  className?: string;
  placeholder?: string;
  /** Hero variant: pill-shaped, larger input, 54px submit on mobile */
  variant?: 'default' | 'hero';
  /** When set, input can be focused by bottom nav Search (custom event + hash #hero-search) */
  inputId?: string;
}

/**
 * AI-powered natural language search bar
 * Parses queries like "SUVs under R300k" into structured filters
 */
export function AISearchBar({
  className = '',
  placeholder = 'Try "SUVs under R300k" or "Toyota automatic"',
  variant = 'default',
  inputId,
}: AISearchBarProps) {
  const isHero = variant === 'hero';
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!inputId) return;
    const focus = () => inputRef.current?.focus();
    const onEvent = () => focus();
    window.addEventListener(FOCUS_HERO_SEARCH, onEvent);
    if (typeof window !== 'undefined' && window.location.hash === '#hero-search') {
      focus();
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    return () => window.removeEventListener(FOCUS_HERO_SEARCH, onEvent);
  }, [inputId]);

  /**
   * Build URL search params from parsed filters
   */
  function buildSearchParams(filters: ParsedIntentFilters): URLSearchParams {
    const params = new URLSearchParams();
    
    if (filters.make) params.set('make', filters.make);
    if (filters.model) params.set('model', filters.model);
    if (filters.bodyType) params.set('bodyType', filters.bodyType);
    if (filters.minPrice != null) params.set('minPrice', String(filters.minPrice));
    if (filters.maxPrice != null) params.set('maxPrice', String(filters.maxPrice));
    if (filters.minYear != null) params.set('minYear', String(filters.minYear));
    if (filters.maxYear != null) params.set('maxYear', String(filters.maxYear));
    if (filters.fuelType) params.set('fuelType', filters.fuelType);
    if (filters.transmission) params.set('transmission', filters.transmission);
    
    return params;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await parseSearchIntent(trimmedQuery);
      
      // If confidence is high enough, use extracted filters
      if (result.confidence >= 0.3 && Object.keys(result.filters).length > 0) {
        const params = buildSearchParams(result.filters);
        router.push(`/cars?${params.toString()}`);
      } else {
        // Fall back to full-text search
        router.push(`/cars?q=${encodeURIComponent(trimmedQuery)}`);
      }
    } catch (err) {
      console.error('Intent parsing failed:', err);
      // Fall back to full-text search on error
      router.push(`/cars?q=${encodeURIComponent(trimmedQuery)}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`w-full ${className}`}>
      <div
        className={`relative flex items-center min-w-0 bg-white border border-border text-[15px] text-[#050B20] placeholder:text-[#818181] focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary/20 transition-all disabled:opacity-60 ${
          isHero ? 'min-h-[54px] rounded-full pl-4 pr-[100px] sm:pr-[110px] shadow-[0px_10px_40px_rgba(0,0,0,0.05)]' : 'h-12 pl-11 pr-24 rounded-[12px]'
        }`}
      >
        <div className={`pointer-events-none shrink-0 absolute ${isHero ? 'left-4' : 'left-3.5'}`}>
          <Search className={`${isHero ? 'w-5 h-5 text-[#405FF2]' : 'w-4 h-4 text-[#818181]'}`} aria-hidden />
        </div>

        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className={`min-w-0 flex-1 bg-transparent outline-none border-0 truncate ${isHero ? 'h-[52px] pl-10 pr-2 text-[15px]' : 'h-12 pl-11'}`}
          aria-label="AI-powered car search"
        />

        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className={`absolute flex items-center justify-center gap-1.5 shrink-0 bg-[#405FF2] text-white font-medium hover:bg-[#3651E0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
            isHero
              ? 'right-1.5 top-1/2 -translate-y-1/2 min-h-[46px] h-[46px] px-4 rounded-full text-[13px] sm:px-5 sm:text-[14px]'
              : 'right-1.5 h-9 px-3 rounded-[8px] text-[13px]'
          }`}
          aria-label={isLoading ? 'Searching...' : 'Search'}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <DynamicIcon name="ai-svgrepo-com" width={16} height={16} className="shrink-0" aria-hidden />
              <span>{isHero ? 'Search' : 'AI'}</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-400 text-center">{error}</p>
      )}
    </form>
  );
}
