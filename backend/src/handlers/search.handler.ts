import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SearchService, ValidationError } from '../services/search.service';
import { SearchRepository, SearchFilters } from '../repositories/search.repository';
import { CarRepository } from '../repositories/cars.repository';
import { OpenSearchError } from '../lib/opensearch';
import { getBedrockClient } from '../lib/bedrock';
import { ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

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
 * - q: prefix query text (minimum 2 characters for text search, empty for all values) - REQUIRED
 * - make: filter by make (for model and variant suggestions) - OPTIONAL
 * - model: filter by model (for variant suggestions) - OPTIONAL
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
    
    if (!params.field || params.q === undefined) {
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
    
    const result = await searchService.getSuggestions(
      params.field, 
      params.q, 
      {
        make: params.make,
        model: params.model
      }
    );
    
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
 * System prompt for intent parsing - extracts structured filters from natural language
 */
const INTENT_PARSING_SYSTEM_PROMPT = `You are a car search intent parser for Prime Deal Auto, a South African car dealership.
Extract structured filters from natural language queries.

Price format: South African Rand (ZAR). "R300k" = 300000, "R1.5M" = 1500000, "300000" = 300000
Body types: SUV, Sedan, Hatchback, Bakkie, Coupe, Convertible, Wagon
Fuel types: petrol, diesel, electric, hybrid
Transmissions: automatic, manual, cvt

Common patterns:
- "under R300k" or "below R300k" → maxPrice: 300000
- "above R200k" or "over R200k" → minPrice: 200000
- "between R200k and R400k" → minPrice: 200000, maxPrice: 400000
- "2020 or newer" → minYear: 2020
- "older than 2018" → maxYear: 2017
- Brand names like "Toyota", "BMW", "Mercedes" → make
- Model names like "Corolla", "X5", "C-Class" → model

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "filters": {
    "make": "string or null",
    "model": "string or null",
    "bodyType": "string or null",
    "minPrice": "number or null",
    "maxPrice": "number or null",
    "minYear": "number or null",
    "maxYear": "number or null",
    "fuelType": "string or null",
    "transmission": "string or null"
  },
  "confidence": 0.0 to 1.0
}

Only include fields you can confidently extract. Set confidence based on how clear the query is.
If the query is unclear or doesn't contain recognizable car search terms, return empty filters with confidence: 0.`;

/**
 * POST /search/intent - Parse natural language query into structured filters
 * 
 * Request body:
 * - query: natural language search query (required)
 * 
 * Returns: Extracted filters with confidence score
 * 
 * Requirements: UAT 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8
 */
export async function handleIntent(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*'
  };

  try {
    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing request body',
          code: 'VALIDATION_ERROR'
        })
      };
    }

    let body: { query?: string };
    try {
      body = JSON.parse(event.body);
    } catch {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body',
          code: 'VALIDATION_ERROR'
        })
      };
    }

    const { query } = body;
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing required field: query',
          code: 'VALIDATION_ERROR'
        })
      };
    }

    // Call Bedrock to parse intent
    const client = getBedrockClient();
    const modelId = process.env.BEDROCK_MODEL_ID || 'amazon.nova-pro-v1:0';

    const command = new ConverseCommand({
      modelId,
      messages: [
        {
          role: 'user',
          content: [{ text: `Parse this car search query: "${query.trim()}"` }]
        }
      ],
      system: [{ text: INTENT_PARSING_SYSTEM_PROMPT }],
      inferenceConfig: {
        maxTokens: 512,
        temperature: 0 // Greedy decoding for consistent structured output
      }
    });

    const response = await client.send(command);
    
    // Extract text response
    const outputMessage = response.output?.message;
    const textContent = outputMessage?.content?.find(
      (block: any) => 'text' in block
    );
    const responseText = textContent?.text || '';

    // Parse JSON from response
    let parsedResult: {
      filters: Record<string, any>;
      confidence: number;
    };

    try {
      // Try to extract JSON from the response (handle potential markdown wrapping)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      parsedResult = JSON.parse(jsonMatch[0]);
    } catch {
      console.error('Failed to parse Bedrock response:', responseText);
      // Return fallback with low confidence
      parsedResult = {
        filters: {},
        confidence: 0
      };
    }

    // Clean up filters - remove null values
    const cleanFilters: Record<string, any> = {};
    for (const [key, value] of Object.entries(parsedResult.filters || {})) {
      if (value !== null && value !== undefined && value !== '') {
        cleanFilters[key] = value;
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          filters: cleanFilters,
          confidence: parsedResult.confidence || 0,
          fallbackQuery: parsedResult.confidence < 0.3 ? query.trim() : undefined
        }
      })
    };
  } catch (error) {
    console.error('Intent parsing error:', error);
    
    // Return graceful fallback on any error
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          filters: {},
          confidence: 0,
          fallbackQuery: event.body ? JSON.parse(event.body).query : undefined
        }
      })
    };
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
