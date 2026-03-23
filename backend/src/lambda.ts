import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { corsResponse, error } from './lib/response';
import { handleGetCars, handleGetCarById, handleCreateCar, handleUpdateCar, handleDeleteCar } from './handlers/cars.handler';
import { handleHealth } from './handlers/health.handler';
import {
  handleSearch,
  handleFacets,
  handleSuggestions,
  handleReindex,
  handleIntent,
} from './handlers/search.handler';
import {
  handleGenerateUploadUrl,
  handleSaveImageMetadata,
  handleDeleteImage,
  handleSetPrimaryImage,
  handleReorderImages,
} from './handlers/images.handler';
import { handleCreateLead } from './handlers/leads.handler';
import { handleTrackEvent, handleGetAnalyticsStats } from './handlers/analytics.handler';
import {
  handleGetLeads,
  handleGetLeadStats,
  handleGetLeadById,
  handleUpdateLead,
  handleDeleteLead,
  handleGetLeadNotes,
  handleAddLeadNote,
  handleGetLeadHistory,
} from './handlers/admin-leads.handler';
import {
  handleGetMakes,
  handleCreateMake,
  handleGetModels,
  handleCreateModel,
  handleGetVariants,
  handleCreateVariant,
} from './handlers/makes.handler';

type RouteHandler = (
  event: APIGatewayProxyEvent
) => Promise<APIGatewayProxyResult>;

interface Route {
  method: string;
  pattern: RegExp;
  handler: RouteHandler;
}

const routes: Route[] = [
  // Health check
  { method: 'GET', pattern: /^\/health$/, handler: handleHealth },

  // Cars routes
  { method: 'POST', pattern: /^\/cars$/, handler: handleCreateCar },
  { method: 'GET', pattern: /^\/cars$/, handler: handleGetCars },
  { method: 'GET', pattern: /^\/cars\/([^/]+)$/, handler: handleGetCarById },
  { method: 'PUT', pattern: /^\/cars\/([^/]+)$/, handler: handleUpdateCar },
  { method: 'DELETE', pattern: /^\/cars\/([^/]+)$/, handler: handleDeleteCar },

  // Image management routes (admin only)
  { method: 'POST', pattern: /^\/cars\/([^/]+)\/images\/upload-url$/, handler: handleGenerateUploadUrl },
  { method: 'POST', pattern: /^\/cars\/([^/]+)\/images$/, handler: handleSaveImageMetadata },
  { method: 'DELETE', pattern: /^\/cars\/([^/]+)\/images\/([^/]+)$/, handler: handleDeleteImage },
  { method: 'PUT', pattern: /^\/cars\/([^/]+)\/images\/([^/]+)\/primary$/, handler: handleSetPrimaryImage },
  { method: 'PUT', pattern: /^\/cars\/([^/]+)\/images\/reorder$/, handler: handleReorderImages },

  // Makes, Models, Variants routes
  { method: 'GET', pattern: /^\/makes$/, handler: handleGetMakes },
  { method: 'POST', pattern: /^\/makes$/, handler: handleCreateMake },
  { method: 'GET', pattern: /^\/makes\/([^/]+)\/models$/, handler: handleGetModels },
  { method: 'POST', pattern: /^\/makes\/([^/]+)\/models$/, handler: handleCreateModel },
  { method: 'GET', pattern: /^\/models\/([^/]+)\/variants$/, handler: handleGetVariants },
  { method: 'POST', pattern: /^\/models\/([^/]+)\/variants$/, handler: handleCreateVariant },

  // Leads (contact form)
  { method: 'POST', pattern: /^\/leads$/, handler: handleCreateLead },

  // Analytics (public tracking + admin stats)
  { method: 'POST', pattern: /^\/analytics$/, handler: handleTrackEvent },
  { method: 'GET', pattern: /^\/admin\/analytics\/stats$/, handler: handleGetAnalyticsStats },

  // Admin leads routes
  { method: 'GET', pattern: /^\/admin\/leads$/, handler: handleGetLeads },
  { method: 'GET', pattern: /^\/admin\/leads\/stats$/, handler: handleGetLeadStats },
  { method: 'GET', pattern: /^\/admin\/leads\/([^/]+)$/, handler: handleGetLeadById },
  { method: 'PATCH', pattern: /^\/admin\/leads\/([^/]+)$/, handler: handleUpdateLead },
  { method: 'DELETE', pattern: /^\/admin\/leads\/([^/]+)$/, handler: handleDeleteLead },
  { method: 'GET', pattern: /^\/admin\/leads\/([^/]+)\/notes$/, handler: handleGetLeadNotes },
  { method: 'POST', pattern: /^\/admin\/leads\/([^/]+)\/notes$/, handler: handleAddLeadNote },
  { method: 'GET', pattern: /^\/admin\/leads\/([^/]+)\/history$/, handler: handleGetLeadHistory },

  // Search routes
  { method: 'GET', pattern: /^\/search$/, handler: handleSearch },
  { method: 'GET', pattern: /^\/search\/facets$/, handler: handleFacets },
  { method: 'GET', pattern: /^\/search\/suggestions$/, handler: handleSuggestions },
  { method: 'POST', pattern: /^\/search\/intent$/, handler: handleIntent },
  { method: 'POST', pattern: /^\/admin\/reindex$/, handler: handleReindex },
];

function matchRoute(
  method: string,
  path: string
): { handler: RouteHandler; params: Record<string, string> } | null {
  for (const route of routes) {
    if (route.method !== method) continue;

    const match = path.match(route.pattern);
    if (match) {
      // Extract path parameters from regex groups
      const params: Record<string, string> = {};
      
      // Determine parameter names based on route pattern
      if (path.startsWith('/cars/')) {
        if (match[1]) {
          params.carId = match[1];
        }
        if (match[2]) {
          params.imageId = match[2];
        }
      } else if (path.startsWith('/makes/')) {
        if (match[1]) {
          params.makeId = match[1];
        }
      } else if (path.startsWith('/models/')) {
        if (match[1]) {
          params.modelId = match[1];
        }
      } else if (path.startsWith('/admin/leads/')) {
        if (match[1]) {
          params.id = match[1];
        }
      }
      
      return { handler: route.handler, params };
    }
  }
  return null;
}

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const { httpMethod, path } = event;

  // Handle CORS preflight
  if (httpMethod === 'OPTIONS') {
    return corsResponse();
  }

  try {
    const matched = matchRoute(httpMethod, path);

    if (!matched) {
      return error('Route not found', 'NOT_FOUND', 404);
    }

    // Merge extracted params with existing pathParameters
    event.pathParameters = {
      ...event.pathParameters,
      ...matched.params,
    };

    return await matched.handler(event);
  } catch (err) {
    console.error('Unhandled error:', {
      error: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
      path,
      method: httpMethod,
    });

    return error('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
