import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SearchService, SearchFilters, ValidationError } from '../services/search.service';
import { CarRepository } from '../repositories/cars.repository';
import { getBedrockClient } from '../lib/bedrock';
import { ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

// Initialize service instances outside handler for reuse across warm invocations
const carRepository = new CarRepository();
const searchService = new SearchService(carRepository);

/**
 * GET /search - Execute search with filters, pagination, and sorting
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
      condition: params.condition as any,
    };

    const result = await searchService.search({
      query: params.q,
      filters,
      limit: params.limit ? parseInt(params.limit, 10) : undefined,
      offset: params.offset ? parseInt(params.offset, 10) : undefined,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
      },
      body: JSON.stringify({ success: true, data: result }),
    };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /search/facets - Get facet aggregations for filters
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
      condition: params.condition as any,
    };

    const result = await searchService.getFacets(filters);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
      },
      body: JSON.stringify({ success: true, data: result }),
    };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /search/suggestions - Get autocomplete suggestions
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
          'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Missing required parameters: field and q',
          code: 'VALIDATION_ERROR',
        }),
      };
    }

    const result = await searchService.getSuggestions(params.field, params.q, {
      make: params.make,
      model: params.model,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
      },
      body: JSON.stringify({ success: true, data: result }),
    };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /admin/reindex - Now a no-op since PostgreSQL is the search engine.
 * Kept for API compatibility — normalizes make/model casing.
 */
export async function handleReindex(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
        }),
      };
    }

    const groups = claims['cognito:groups'] || '';
    if (!groups.includes('admin')) {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Forbidden: Admin access required',
          code: 'FORBIDDEN',
        }),
      };
    }

    const result = await searchService.reindex();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
      },
      body: JSON.stringify({ success: true, data: result }),
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
 */
export async function handleIntent(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
  };

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing request body',
          code: 'VALIDATION_ERROR',
        }),
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
          code: 'VALIDATION_ERROR',
        }),
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
          code: 'VALIDATION_ERROR',
        }),
      };
    }

    const client = getBedrockClient();
    const modelId = process.env.BEDROCK_MODEL_ID || 'amazon.nova-lite-v1:0';

    const command = new ConverseCommand({
      modelId,
      messages: [
        {
          role: 'user',
          content: [{ text: `Parse this car search query: "${query.trim()}"` }],
        },
      ],
      system: [{ text: INTENT_PARSING_SYSTEM_PROMPT }],
      inferenceConfig: {
        maxTokens: 512,
        temperature: 0,
      },
    });

    const response = await client.send(command);

    const outputMessage = response.output?.message;
    const textContent = outputMessage?.content?.find(
      (block: any) => 'text' in block
    );
    const responseText = textContent?.text || '';

    let parsedResult: {
      filters: Record<string, any>;
      confidence: number;
    };

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      parsedResult = JSON.parse(jsonMatch[0]);
    } catch {
      console.error('Failed to parse Bedrock response:', responseText);
      parsedResult = { filters: {}, confidence: 0 };
    }

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
          fallbackQuery: parsedResult.confidence < 0.3 ? query.trim() : undefined,
        },
      }),
    };
  } catch (error) {
    console.error('Intent parsing error:', error);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          filters: {},
          confidence: 0,
          fallbackQuery: event.body ? JSON.parse(event.body).query : undefined,
        },
      }),
    };
  }
}

/**
 * Handle errors and return appropriate API Gateway response
 */
function handleError(error: unknown): APIGatewayProxyResult {
  console.error('Handler error:', error);

  if (error instanceof ValidationError) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        code: 'VALIDATION_ERROR',
      }),
    };
  }

  return {
    statusCode: 500,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
    },
    body: JSON.stringify({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    }),
  };
}
