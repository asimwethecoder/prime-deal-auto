// Search API Module
// Functions for interacting with the search endpoints

import { get } from './client';
import { CarWithImages, PaginatedResponse } from './types';

/**
 * Search parameters
 */
export interface SearchParams {
  q?: string;
  limit?: number;
  offset?: number;
  make?: string;
  model?: string;
  variant?: string;
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  transmission?: 'automatic' | 'manual' | 'cvt';
  fuelType?: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  bodyType?: string;
  sortBy?: 'price' | 'year' | 'mileage' | 'relevance';
  sortOrder?: 'asc' | 'desc';
}

/** Backend returns facets with keys: make, model, variant, body_type, fuel_type, transmission, condition */
export type FacetResult = Record<string, Array<{ value: string; count: number }>>;

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
 * Get search facets for filtering (with optional current filters for contextual counts)
 */
export async function getSearchFacets(
  filters?: Partial<SearchParams>
): Promise<FacetResult> {
  const params: Record<string, string | number | undefined> = {};
  if (filters?.make) params.make = filters.make;
  if (filters?.model) params.model = filters.model;
  if (filters?.variant) params.variant = filters.variant;
  if (filters?.minPrice != null) params.minPrice = filters.minPrice;
  if (filters?.maxPrice != null) params.maxPrice = filters.maxPrice;
  if (filters?.minYear != null) params.minYear = filters.minYear;
  if (filters?.maxYear != null) params.maxYear = filters.maxYear;
  if (filters?.bodyType) params.bodyType = filters.bodyType;
  if (filters?.fuelType) params.fuelType = filters.fuelType;
  if (filters?.transmission) params.transmission = filters.transmission;
  if (filters?.condition) params.condition = filters.condition;
  return get<FacetResult>('/search/facets', params);
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

/**
 * Get models for a specific make
 * 
 * @param make - Car make to filter by
 * @returns List of models for the specified make
 */
export async function getModelsForMake(make: string): Promise<SearchSuggestion[]> {
  return get<SearchSuggestion[]>('/search/suggestions', { 
    field: 'model', 
    q: '', 
    make 
  });
}

/**
 * Get variants for a specific make and model
 * 
 * @param make - Car make to filter by
 * @param model - Car model to filter by
 * @returns List of variants for the specified make and model
 */
export async function getVariantsForModel(make: string, model: string): Promise<SearchSuggestion[]> {
  return get<SearchSuggestion[]>('/search/suggestions', { 
    field: 'variant', 
    q: '', 
    make,
    model 
  });
}
