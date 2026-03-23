import { post } from './client';

export type AnalyticsEventType = 'page_view' | 'car_view' | 'pwa_install';

interface TrackEventPayload {
  eventType: AnalyticsEventType;
  pageUrl?: string;
  carId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Track an analytics event.
 * Routes through /api/track (Next.js server route on Amplify CloudFront)
 * so we get CloudFront geo headers for free. Falls back to direct API call.
 */
export function trackEvent(payload: TrackEventPayload): void {
  const clientGeo = getClientGeo();
  const body = {
    ...payload,
    pageUrl: payload.pageUrl || (typeof window !== 'undefined' ? window.location.href : undefined),
    sessionId: payload.sessionId || getSessionId(),
    metadata: { ...clientGeo, ...payload.metadata },
  };

  // Prefer the Next.js proxy route (gets CloudFront geo headers)
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {
    // Fallback: hit the API Gateway directly
    post('/analytics', body).catch(() => {});
  });
}

/** Extract timezone and locale from the browser — free geo signal, no third-party */
function getClientGeo(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; // e.g. "Africa/Johannesburg"
    const locale = navigator.language; // e.g. "en-ZA"
    return { timezone: tz, locale };
  } catch {
    return {};
  }
}

/** Stable per-tab session ID for deduplication */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem('analytics_sid');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('analytics_sid', id);
  }
  return id;
}
