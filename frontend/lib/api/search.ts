// Search API Module
// Functions for interacting with the search endpoints

import { get } from './client';
import { CarWithImages, PaginatedResponse } from './types';

/**
 * Search parameters
 */
export interface SearchParams {
  q: string; // Search query
  limit?: number;
  offset?: number;
  make?: string;
  model?: string;
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  transmission?: 'automatic' | 'manual' | 'cvt';
  fuelType?: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  bodyType?: string;
  sortBy?: 'price' | 'year' | 'mileage' | 'createdAt' | 'relevance';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Search facet (aggregation result)
 */
export interface SearchFacet {
  field: string;
  values: Array<{
    value: string;
    count: number;
  }>;
}

/**
 * Search facets response
 */
export interface SearchFacetsResponse {
  makes: Array<{ value: string; count: number }>;
  bodyTypes: Array<{ value: string; count: number }>;
  fuelTypes: Array<{ value: string; count: number }>;
  transmissions: Array<{ value: string; count: number }>;
  conditions: Array<{ value: string; count: number }>;
  yearRange: { min: number; max: number };
  priceRange: { min: number; max: number };
}

/**
 * Search suggestion
 */
export interface SearchSuggestion {
  text: string;
  field: 'make' | 'model' | 'bodyType';
  count: number;
}

/**
 * Search cars using full-text search
 * 
 * @param params - Search parameters
 * @returns Paginated search results
 */
export async function searchCars(
  params: SearchParams
): Promise<PaginatedResponse<CarWithImages>> {
  return get<PaginatedResponse<CarWithImages>>('/search', params);
}

/**
 * Get search facets for filtering
 * Used to populate filter dropdowns with available options and counts
 * 
 * @returns Aggregated facets
 */
export async function getSearchFacets(): Promise<SearchFacetsResponse> {
  return get<SearchFacetsResponse>('/search/facets');
}

/**
 * Get search suggestions for autocomplete
 * 
 * @param query - Partial search query
 * @param field - Field to search in (make, model, bodyType)
 * @returns List of suggestions
 */
export async function getSearchSuggestions(
  query: string,
  field?: 'make' | 'model' | 'bodyType'
): Promise<SearchSuggestion[]> {
  return get<SearchSuggestion[]>('/search/suggestions', { q: query, field });
}
