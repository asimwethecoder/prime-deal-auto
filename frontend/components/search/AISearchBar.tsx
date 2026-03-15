'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { parseSearchIntent, ParsedIntentFilters } from '@/lib/api/search';

interface AISearchBarProps {
  className?: string;
  placeholder?: string;
}

/**
 * AI-powered natural language search bar
 * Parses queries like "SUVs under R300k" into structured filters
 */
export function AISearchBar({ 
  className = '', 
  placeholder = 'Try "SUVs under R300k" or "Toyota automatic"' 
}: AISearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <div className="relative flex items-center">
        <div className="absolute left-3.5 pointer-events-none">
          <Search className="w-4 h-4 text-[#818181]" aria-hidden />
        </div>
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className="w-full h-12 pl-11 pr-24 bg-white border border-border rounded-[12px] text-[15px] text-[#050B20] placeholder:text-[#818181] focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 disabled:opacity-60 transition-all"
          aria-label="AI-powered car search"
        />
        
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-1.5 flex items-center justify-center gap-1.5 h-9 px-3 bg-[#405FF2] text-white rounded-[8px] font-medium text-[13px] hover:bg-[#3651E0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label={isLoading ? 'Searching...' : 'Search'}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <DynamicIcon name="ai-svgrepo-com" width={16} height={16} className="shrink-0" aria-hidden />
              <span>AI</span>
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
