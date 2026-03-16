/**
 * Integration Tests: Search Operations
 * 
 * Tests for GET /search, GET /search/suggestions, GET /search/facets, POST /admin/reindex
 */

import { describe, it, expect } from 'vitest';
import {
  SEARCH_QUERIES,
  createMockEvent,
  createAdminEvent,
  createUserEvent,
  expectSuccess,
  expectError,
  PaginatedResponse,
} from './test-fixtures';
import {
  handleSearch,
  handleSuggestions,
  handleFacets,
  handleReindex,
} from '../../src/handlers/search.handler';

describe('Search Operations', () => {
  // ============================================
  // GET /search - Full-text Search
  // ============================================
  describe('GET /search - Full-text Search', () => {
    it('returns paginated results without query', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/search',
      });

      const result = await handleSearch(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<PaginatedResponse<any>>(result.body);
      
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('page');
      expect(data).toHaveProperty('limit');
      expect(data).toHaveProperty('hasMore');
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('searches by make filter', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/search',
        queryStringParameters: SEARCH_QUERIES.byMake,
      });

      const result = await handleSearch(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<PaginatedResponse<any>>(result.body);
      
      // All results should match the make filter
      data.data.forEach((car: any) => {
        expect(car.make.toLowerCase()).toBe('toyota');
      });
    });

    it('searches by price range', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/search',
        queryStringParameters: {
          minPrice: String(SEARCH_QUERIES.byPriceRange.minPrice),
          maxPrice: String(SEARCH_QUERIES.byPriceRange.maxPrice),
        },
      });

      const result = await handleSearch(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<PaginatedResponse<any>>(result.body);
      
      data.data.forEach((car: any) => {
        const price = parseFloat(car.price);
        expect(price).toBeGreaterThanOrEqual(200000);
        expect(price).toBeLessThanOrEqual(500000);
      });
    });

    it('searches by year range', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/search',
        queryStringParameters: {
          minYear: String(SEARCH_QUERIES.byYear.minYear),
        },
      });

      const result = await handleSearch(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<PaginatedResponse<any>>(result.body);
      
      data.data.forEach((car: any) => {
        expect(car.year).toBeGreaterThanOrEqual(2022);
      });
    });

    it('searches by body type', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/search',
        queryStringParameters: SEARCH_QUERIES.byBodyType,
      });

      const result = await handleSearch(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<PaginatedResponse<any>>(result.body);
      
      data.data.forEach((car: any) => {
        expect(car.body_type.toLowerCase()).toBe('suv');
      });
    });

    it('searches by fuel type', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/search',
        queryStringParameters: SEARCH_QUERIES.byFuelType,
      });

      const result = await handleSearch(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<PaginatedResponse<any>>(result.body);
      
      data.data.forEach((car: any) => {
        expect(car.fuel_type).toBe('diesel');
      });
    });

    it('searches by transmission', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/search',
        queryStringParameters: SEARCH_QUERIES.byTransmission,
      });

      const result = await handleSearch(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<PaginatedResponse<any>>(result.body);
      
      data.data.forEach((car: any) => {
        expect(car.transmission).toBe('automatic');
      });
    });

    it('searches with combined filters', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/search',
        queryStringParameters: {
          make: SEARCH_QUERIES.combined.make,
          minPrice: String(SEARCH_QUERIES.combined.minPrice),
          bodyType: SEARCH_QUERIES.combined.bodyType,
          fuelType: SEARCH_QUERIES.combined.fuelType,
        },
      });

      const result = await handleSearch(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<PaginatedResponse<any>>(result.body);
      
      data.data.forEach((car: any) => {
        expect(car.make.toLowerCase()).toBe('bmw');
        expect(parseFloat(car.price)).toBeGreaterThanOrEqual(1000000);
        expect(car.body_type.toLowerCase()).toBe('suv');
        expect(car.fuel_type).toBe('diesel');
      });
    });

    it('respects pagination parameters', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/search',
        queryStringParameters: {
          limit: '5',
          offset: '0',
        },
      });

      const result = await handleSearch(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<PaginatedResponse<any>>(result.body);
      
      expect(data.limit).toBe(5);
      expect(data.data.length).toBeLessThanOrEqual(5);
    });

    it('sorts by price ascending', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/search',
        queryStringParameters: {
          sortBy: 'price',
          sortOrder: 'asc',
          limit: '10',
        },
      });

      const result = await handleSearch(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<PaginatedResponse<any>>(result.body);
      
      for (let i = 1; i < data.data.length; i++) {
        expect(parseFloat(data.data[i].price)).toBeGreaterThanOrEqual(
          parseFloat(data.data[i - 1].price)
        );
      }
    });

    it('sorts by year descending', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/search',
        queryStringParameters: {
          sortBy: 'year',
          sortOrder: 'desc',
          limit: '10',
        },
      });

      const result = await handleSearch(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<PaginatedResponse<any>>(result.body);
      
      for (let i = 1; i < data.data.length; i++) {
        expect(data.data[i].year).toBeLessThanOrEqual(data.data[i - 1].year);
      }
    });
  });


  // ============================================
  // GET /search/suggestions - Autocomplete
  // ============================================
  describe('GET /search/suggestions - Autocomplete', () => {
    it('returns suggestions for make field', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/search/suggestions',
        queryStringParameters: {
          field: 'make',
          q: 'toy',
        },
      });

      const result = await handleSuggestions(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<string[]>(result.body);
      
      expect(Array.isArray(data)).toBe(true);
      // Suggestions should match the prefix
      data.forEach((suggestion: string) => {
        expect(suggestion.toLowerCase()).toContain('toy');
      });
    });

    it('returns suggestions for model field with make filter', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/search/suggestions',
        queryStringParameters: {
          field: 'model',
          q: '',
          make: 'Toyota',
        },
      });

      const result = await handleSuggestions(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<string[]>(result.body);
      
      expect(Array.isArray(data)).toBe(true);
    });

    it('returns suggestions for variant field with make and model filter', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/search/suggestions',
        queryStringParameters: {
          field: 'variant',
          q: '',
          make: 'Toyota',
          model: 'Corolla',
        },
      });

      const result = await handleSuggestions(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<string[]>(result.body);
      
      expect(Array.isArray(data)).toBe(true);
    });

    it('returns 400 when field is missing', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/search/suggestions',
        queryStringParameters: {
          q: 'toy',
        },
      });

      const result = await handleSuggestions(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

    it('returns 400 when q is missing', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/search/suggestions',
        queryStringParameters: {
          field: 'make',
        },
      });

      const result = await handleSuggestions(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

    it('limits results to 10 suggestions', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/search/suggestions',
        queryStringParameters: {
          field: 'make',
          q: '',
        },
      });

      const result = await handleSuggestions(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<string[]>(result.body);
      
      expect(data.length).toBeLessThanOrEqual(10);
    });
  });

  // ============================================
  // GET /search/facets - Filter Aggregations
  // ============================================
  describe('GET /search/facets - Filter Aggregations', () => {
    it('returns facet aggregations without filters', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/search/facets',
      });

      const result = await handleFacets(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<any>(result.body);
      
      // Should have facet categories
      expect(data).toHaveProperty('makes');
      expect(data).toHaveProperty('bodyTypes');
      expect(data).toHaveProperty('fuelTypes');
      expect(data).toHaveProperty('transmissions');
      expect(data).toHaveProperty('conditions');
      expect(data).toHaveProperty('yearRange');
      expect(data).toHaveProperty('priceRange');
    });

    it('returns facets filtered by make', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/search/facets',
        queryStringParameters: {
          make: 'Toyota',
        },
      });

      const result = await handleFacets(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<any>(result.body);
      
      // Facets should reflect filtered data
      expect(data).toHaveProperty('makes');
      expect(data).toHaveProperty('models');
    });

    it('returns facets filtered by price range', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/search/facets',
        queryStringParameters: {
          minPrice: '200000',
          maxPrice: '500000',
        },
      });

      const result = await handleFacets(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<any>(result.body);
      
      // Price range should reflect the filter
      if (data.priceRange) {
        expect(data.priceRange.min).toBeGreaterThanOrEqual(200000);
        expect(data.priceRange.max).toBeLessThanOrEqual(500000);
      }
    });

    it('facet counts are accurate', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/search/facets',
      });

      const result = await handleFacets(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<any>(result.body);
      
      // Each facet value should have a count
      if (data.makes && Array.isArray(data.makes)) {
        data.makes.forEach((facet: any) => {
          expect(facet).toHaveProperty('value');
          expect(facet).toHaveProperty('count');
          expect(typeof facet.count).toBe('number');
          expect(facet.count).toBeGreaterThanOrEqual(0);
        });
      }
    });
  });


  // ============================================
  // POST /admin/reindex - Bulk Reindex (Admin Only)
  // ============================================
  describe('POST /admin/reindex - Bulk Reindex', () => {
    it('reindexes all cars when admin', async () => {
      const event = createAdminEvent({
        httpMethod: 'POST',
        path: '/admin/reindex',
      });

      const result = await handleReindex(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<any>(result.body);
      
      expect(data).toHaveProperty('indexed');
      expect(typeof data.indexed).toBe('number');
      expect(data.indexed).toBeGreaterThanOrEqual(0);
    });

    it('returns 401 when not authenticated', async () => {
      const event = createMockEvent({
        httpMethod: 'POST',
        path: '/admin/reindex',
      });

      const result = await handleReindex(event);

      expect(result.statusCode).toBe(401);
      expectError(result.body, 'UNAUTHORIZED');
    });

    it('returns 403 when not admin', async () => {
      const event = createUserEvent({
        httpMethod: 'POST',
        path: '/admin/reindex',
      });

      const result = await handleReindex(event);

      expect(result.statusCode).toBe(403);
      expectError(result.body, 'FORBIDDEN');
    });
  });
});
