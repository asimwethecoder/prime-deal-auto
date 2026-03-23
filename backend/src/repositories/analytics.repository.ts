import { getPool } from '../lib/database';

export interface TrackEventInput {
  eventType: 'page_view' | 'car_view' | 'pwa_install';
  pageUrl?: string;
  carId?: string;
  sessionId?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface AnalyticsStats {
  totalPageViews: number;
  totalCarViews: number;
  totalPwaInstalls: number;
  topCars: { car_id: string; make: string; model: string; year: number; views: number; primary_image_url?: string }[];
  regionBreakdown: { country: string; city: string; count: number }[];
  viewsByDay: { date: string; views: number }[];
}

export class AnalyticsRepository {
  async trackEvent(input: TrackEventInput): Promise<string> {
    const pool = await getPool();
    const result = await pool.query(
      `INSERT INTO analytics_events (event_type, page_url, car_id, session_id, user_id, ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
       RETURNING id`,
      [
        input.eventType,
        input.pageUrl || null,
        input.carId || null,
        input.sessionId || null,
        input.userId || null,
        input.ipAddress || null,
        input.userAgent || null,
        JSON.stringify(input.metadata || {}),
      ]
    );

    // Increment views_count on the car for car_view events
    if (input.eventType === 'car_view' && input.carId) {
      await pool.query(
        'UPDATE cars SET views_count = views_count + 1 WHERE id = $1',
        [input.carId]
      );
    }

    return result.rows[0].id;
  }

  async getStats(days = 30): Promise<AnalyticsStats> {
    const pool = await getPool();
    const since = `NOW() - INTERVAL '${days} days'`;

    // Totals by event type
    const totalsResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE event_type = 'page_view') AS total_page_views,
        COUNT(*) FILTER (WHERE event_type = 'car_view') AS total_car_views,
        COUNT(*) FILTER (WHERE event_type = 'pwa_install') AS total_pwa_installs
      FROM analytics_events
      WHERE created_at >= ${since}
    `);
    const totals = totalsResult.rows[0];

    // Top viewed cars
    const topCarsResult = await pool.query(`
      SELECT ae.car_id, c.make, c.model, c.year, COUNT(*) AS views,
        COALESCE(
          (SELECT ci.cloudfront_url FROM car_images ci WHERE ci.car_id = c.id AND ci.is_primary = true LIMIT 1),
          (SELECT ci.cloudfront_url FROM car_images ci WHERE ci.car_id = c.id ORDER BY ci.order_index ASC LIMIT 1)
        ) AS primary_image_url
      FROM analytics_events ae
      JOIN cars c ON ae.car_id = c.id
      WHERE ae.event_type = 'car_view' AND ae.created_at >= ${since}
      GROUP BY ae.car_id, c.make, c.model, c.year, c.id
      ORDER BY views DESC
      LIMIT 10
    `);

    // Region breakdown from metadata->country and metadata->city
    const regionResult = await pool.query(`
      SELECT
        COALESCE(metadata->>'country', 'Unknown') AS country,
        COALESCE(metadata->>'city', 'Unknown') AS city,
        COUNT(*) AS count
      FROM analytics_events
      WHERE created_at >= ${since}
        AND metadata->>'country' IS NOT NULL
      GROUP BY country, city
      ORDER BY count DESC
      LIMIT 20
    `);

    // Views per day (car_view + page_view)
    const viewsByDayResult = await pool.query(`
      SELECT DATE(created_at) AS date, COUNT(*) AS views
      FROM analytics_events
      WHERE event_type IN ('car_view', 'page_view') AND created_at >= ${since}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    return {
      totalPageViews: parseInt(totals.total_page_views, 10),
      totalCarViews: parseInt(totals.total_car_views, 10),
      totalPwaInstalls: parseInt(totals.total_pwa_installs, 10),
      topCars: topCarsResult.rows.map((r) => ({
        car_id: r.car_id,
        make: r.make,
        model: r.model,
        year: r.year,
        views: parseInt(r.views, 10),
        primary_image_url: r.primary_image_url,
      })),
      regionBreakdown: regionResult.rows.map((r) => ({
        country: r.country,
        city: r.city,
        count: parseInt(r.count, 10),
      })),
      viewsByDay: viewsByDayResult.rows.map((r) => ({
        date: r.date,
        views: parseInt(r.views, 10),
      })),
    };
  }
}
