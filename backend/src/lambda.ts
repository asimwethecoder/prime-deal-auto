import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

function response(statusCode: number, body: object): APIGatewayProxyResult {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body),
  };
}

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const method = event.httpMethod;
    const path = event.path;

    // CORS preflight
    if (method === 'OPTIONS') {
      return response(200, {});
    }

    // Health check
    if (method === 'GET' && path === '/health') {
      return response(200, { success: true, data: { status: 'ok' } });
    }

    // 404 fallback
    return response(404, {
      success: false,
      error: 'Not found',
      code: 'NOT_FOUND',
    });
  } catch (error) {
    console.error('Unhandled error:', error);
    return response(500, {
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}
