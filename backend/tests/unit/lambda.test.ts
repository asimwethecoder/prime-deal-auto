import { describe, it, expect } from 'vitest';
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../../src/lambda';

function createEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    httpMethod: 'GET',
    path: '/',
    body: null,
    headers: {},
    multiValueHeaders: {},
    isBase64Encoded: false,
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as APIGatewayProxyEvent['requestContext'],
    resource: '',
    ...overrides,
  };
}

describe('Lambda handler', () => {
  it('returns 200 with success response for GET /health', async () => {
    const event = createEvent({ httpMethod: 'GET', path: '/health' });
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ok');
  });

  it('returns 404 with NOT_FOUND code for unmatched routes', async () => {
    const event = createEvent({ httpMethod: 'GET', path: '/unknown' });
    const result = await handler(event);

    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body);
    expect(body.success).toBe(false);
    expect(body.code).toBe('NOT_FOUND');
  });

  it('returns 200 with CORS headers for OPTIONS requests', async () => {
    const event = createEvent({ httpMethod: 'OPTIONS', path: '/any-path' });
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(result.headers?.['Access-Control-Allow-Origin']).toBeDefined();
    expect(result.headers?.['Access-Control-Allow-Headers']).toBeDefined();
    expect(result.headers?.['Access-Control-Allow-Methods']).toBeDefined();
  });

  it('includes CORS headers on all responses', async () => {
    const event = createEvent({ httpMethod: 'GET', path: '/health' });
    const result = await handler(event);

    expect(result.headers?.['Access-Control-Allow-Origin']).toBeDefined();
    expect(result.headers?.['Access-Control-Allow-Methods']).toBeDefined();
  });
});
