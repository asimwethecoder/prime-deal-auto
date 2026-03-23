import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://urwy8bxz7g.execute-api.us-east-1.amazonaws.com/v1';

/**
 * POST /api/track
 *
 * Proxies analytics events to the backend Lambda.
 * Because this runs on Amplify's CloudFront edge, we can read
 * CloudFront-Viewer-Country/City headers and inject them as geo metadata.
 * This gives us in-house geo resolution with zero third-party services.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract CloudFront geo headers injected by Amplify's CloudFront distribution
    const country = request.headers.get('cloudfront-viewer-country') || undefined;
    const city = request.headers.get('cloudfront-viewer-city') || undefined;
    const region = request.headers.get('cloudfront-viewer-country-region') || undefined;
    const regionName = request.headers.get('cloudfront-viewer-country-region-name') || undefined;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined;

    // Merge geo data into metadata
    const geo: Record<string, string> = {};
    if (country) geo.country = country;
    if (city) geo.city = decodeURIComponent(city);
    if (region) geo.region = region;
    if (regionName) geo.regionName = decodeURIComponent(regionName);

    const enrichedBody = {
      ...body,
      metadata: { ...body.metadata, ...geo, ip_from_proxy: ip },
    };

    // Forward to backend Lambda
    const res = await fetch(`${API_BASE_URL}/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enrichedBody),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: 'Tracking failed' }, { status: 500 });
  }
}
