-- Migration: Add GIN index on analytics_events metadata for geo queries
-- The metadata JSONB column stores country, city, region, timezone from CloudFront headers

CREATE INDEX IF NOT EXISTS idx_analytics_metadata_gin ON analytics_events USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_analytics_metadata_country ON analytics_events ((metadata->>'country'));
