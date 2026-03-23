import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { success, error } from '../lib/response';
import { AnalyticsRepository } from '../repositories/analytics.repository';

const analyticsRepo = new AnalyticsRepository();

const VALID_EVENT_TYPES = ['page_view', 'car_view', 'pwa_install'] as const;

/**
 * Extract client geo info from CloudFront/API Gateway headers.
 * Amplify hosting uses CloudFront, which injects these headers automatically.
 * No third-party GeoIP service needed.
 */
function extractGeoMetadata(event: APIGatewayProxyEvent): Record<string, string> {
  const headers = event.headers || {};
  const geo: Record<string, string> = {};

  // CloudFront geo headers (available when request passes through CloudFront/Amplify)
  const country = headers['CloudFront-Viewer-Country'] || headers['cloudfront-viewer-country'];
  const city = headers['CloudFront-Viewer-City'] || headers['cloudfront-viewer-city'];
  const region = headers['CloudFront-Viewer-Country-Region'] || headers['cloudfront-viewer-country-region'];
  const regionName = headers['CloudFront-Viewer-Country-Region-Name'] || headers['cloudfront-viewer-country-region-name'];

  if (country) geo.country = country;
  if (city) geo.city = decodeURIComponent(city);
  if (region) geo.region = region;
  if (regionName) geo.regionName = decodeURIComponent(regionName);

  return geo;
}

function getClientIp(event: APIGatewayProxyEvent): string | undefined {
  return event.requestContext?.identity?.sourceIp || event.headers?.['X-Forwarded-For']?.split(',')[0]?.trim();
}

/**
 * POST /analytics — public endpoint to track events
 */
export async function handleTrackEvent(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return error('Invalid JSON body', 'VALIDATION_ERROR', 400);
  }

  const eventType = body.eventType as string;
  if (!eventType || !VALID_EVENT_TYPES.includes(eventType as typeof VALID_EVENT_TYPES[number])) {
    return error(`eventType must be one of: ${VALID_EVENT_TYPES.join(', ')}`, 'VALIDATION_ERROR', 400);
  }

  // Merge client-sent metadata with server-extracted geo data
  const clientMetadata = typeof body.metadata === 'object' && body.metadata ? body.metadata as Record<string, unknown> : {};
  const geoMetadata = extractGeoMetadata(event);
  const metadata = { ...clientMetadata, ...geoMetadata };

  try {
    const id = await analyticsRepo.trackEvent({
      eventType: eventType as 'page_view' | 'car_view' | 'pwa_install',
      pageUrl: typeof body.pageUrl === 'string' ? body.pageUrl : undefined,
      carId: typeof body.carId === 'string' ? body.carId : undefined,
      sessionId: typeof body.sessionId === 'string' ? body.sessionId : undefined,
      ipAddress: getClientIp(event),
      userAgent: event.headers?.['User-Agent'] || event.headers?.['user-agent'],
      metadata,
    });

    return success({ id }, 201);
  } catch (err) {
    console.error('Analytics tracking error:', err);
    return error('Failed to track event', 'INTERNAL_ERROR', 500);
  }
}

/**
 * GET /admin/analytics/stats — admin endpoint for dashboard stats
 */
export async function handleGetAnalyticsStats(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const days = parseInt(event.queryStringParameters?.days || '30', 10);
  const safeDays = Math.min(Math.max(days, 1), 365);

  try {
    const stats = await analyticsRepo.getStats(safeDays);
    return success(stats);
  } catch (err) {
    console.error('Analytics stats error:', err);
    return error('Failed to fetch analytics stats', 'INTERNAL_ERROR', 500);
  }
}
