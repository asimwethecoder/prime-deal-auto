import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SearchService, ValidationError } from '../services/search.service';
import { SearchRepository, SearchFilters } from '../repositories/search.repository';
import { CarRepository } from '../repositories/cars.repository';
import { OpenSearchError } from '../lib/opensearch';

// Initialize service instances outside handler for reuse across warm invocations
const searchRepository = new SearchRepository();
const carRepository = new CarRepository();
const searchService = new SearchService(searchRepository, carRepository);

/**
 * GET /search - Execute search with filters, pagination, and sorting
 * 
 * Query parameters:
 * - q: search query text (optional)
 * - make, model, variant: string filters (optional)
 * - minPrice, maxPrice: price range filters (optional)
 * - minYear, maxYear: year range filters (optional)
 * - bodyType: body type filter (optional)
 * - fuelType: fuel type enum filter (optional)
 * - transmission: transmission enum filter (optional)
 * - condition: condition enum filter (optional)
 * - limit: results per page (default 20, max 100)
 * - offset: pagination offset (default 0)
 * - sortBy: sort field (price, year, mileage, relevance)
 * - sortOrder: sort direction (asc, desc)
 * 
 * Returns: Paginated response with car documents
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 3.8
 */
export async function handleSearch(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const params = event.queryStringParameters || {};
    
    const filters: SearchFilters = {
      make: params.make,
      model: params.model,
      variant: params.variant,
      minPrice: params.minPrice ? parseFloat(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? parseFloat(params.maxPrice) : undefined,
      minYear: params.minYear ? parseInt(params.minYear, 10) : undefined,
      maxYear: params.maxYear ? parseInt(params.maxYear, 10) : undefined,
      bodyType: params.bodyType,
      fuelType: params.fuelType as any,
      transmission: params.transmission as any,
      condition: params.condition as any
    };
    
    const result = await searchService.search({
      query: params.q,
      filters,
      limit: params.limit ? parseInt(params.limit, 10) : undefined,
      offset: params.offset ? parseInt(params.offset, 10) : undefined,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder
    });
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*'
      },
      body: JSON.stringify({ success: true, data: result })
    };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /search/facets - Get facet aggregations for filters
 * 
 * Query parameters:
 * - make, model, variant: string filters (optional)
 * - minPrice, maxPrice: price range filters (optional)
 * - minYear, maxYear: year range filters (optional)
 * - bodyType: body type filter (optional)
 * - fuelType: fuel type enum filter (optional)
 * - transmission: transmission enum filter (optional)
 * - condition: condition enum filter (optional)
 * 
 * Returns: Facet results with value counts for each category
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8
 */
export async function handleFacets(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const params = event.queryStringParameters || {};
    
    const filters: SearchFilters = {
      make: params.make,
      model: params.model,
      variant: params.variant,
      minPrice: params.minPrice ? parseFloat(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? parseFloat(params.maxPrice) : undefined,
      minYear: params.minYear ? parseInt(params.minYear, 10) : undefined,
      maxYear: params.maxYear ? parseInt(params.maxYear, 10) : undefined,
      bodyType: params.bodyType,
      fuelType: params.fuelType as any,
      transmission: params.transmission as any,
      condition: params.condition as any
    };
    
    const result = await searchService.getFacets(filters);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*'
      },
      body: JSON.stringify({ success: true, data: result })
    };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /search/suggestions - Get autocomplete suggestions
 * 
 * Query parameters:
 * - field: field to search (make, model, or variant) - REQUIRED
 * - q: prefix query text (minimum 2 characters) - REQUIRED
 * 
 * Returns: Array of up to 10 suggestions ordered by relevance
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.6
 */
export async function handleSuggestions(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const params = event.queryStringParameters || {};
    
    if (!params.field || !params.q) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Missing required parameters: field and q',
          code: 'VALIDATION_ERROR'
        })
      };
    }
    
    const result = await searchService.getSuggestions(params.field, params.q);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*'
      },
      body: JSON.stringify({ success: true, data: result })
    };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /admin/reindex - Reindex all active cars to OpenSearch
 * 
 * Authentication: Requires valid JWT token
 * Authorization: Requires admin group membership
 * 
 * Returns: Object with indexed count
 * 
 * Requirements: 7.1, 12.1, 12.2, 12.3, 12.4
 */
export async function handleReindex(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    // Check authentication
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED'
        })
      };
    }
    
    // Check admin group membership
    const groups = claims['cognito:groups'] || '';
    if (!groups.includes('admin')) {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Forbidden: Admin access required',
          code: 'FORBIDDEN'
        })
      };
    }
    
    const result = await searchService.reindex();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*'
      },
      body: JSON.stringify({ success: true, data: result })
    };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Handle errors and return appropriate API Gateway response
 * 
 * Error mapping:
 * - ValidationError → 400 with VALIDATION_ERROR code
 * - OpenSearchError → 503 with SERVICE_UNAVAILABLE code
 * - All others → 500 with INTERNAL_ERROR code
 * 
 * Never exposes internal errors or stack traces to clients
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4
 */
function handleError(error: unknown): APIGatewayProxyResult {
  console.error('Handler error:', error);
  
  if (error instanceof ValidationError) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        code: 'VALIDATION_ERROR'
      })
    };
  }
  
  if (error instanceof OpenSearchError) {
    return {
      statusCode: 503,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Search service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE'
      })
    };
  }
  
  return {
    statusCode: 500,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*'
    },
    body: JSON.stringify({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    })
  };
}
