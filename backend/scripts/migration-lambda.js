/**
 * Lambda function to run database migrations
 * This runs inside the VPC and can access the RDS Proxy
 */

const { Client } = require('pg');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

// Predefined migrations that can be run by name
const MIGRATIONS = {
  '006_search_vector': `
-- Migration 006: Add full-text search support with tsvector column

-- Add tsvector column for full-text search
ALTER TABLE cars ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_cars_search_vector ON cars USING GIN(search_vector);

-- Drop existing trigger if it exists (for idempotent migration)
DROP TRIGGER IF EXISTS cars_search_vector_trigger ON cars;

-- Create trigger function to auto-update search_vector
CREATE OR REPLACE FUNCTION cars_search_vector_update() RETURNS trigger AS $
DECLARE
  features_text TEXT;
BEGIN
  -- Convert JSONB array to text for search indexing
  SELECT string_agg(value::text, ' ') INTO features_text
  FROM jsonb_array_elements_text(COALESCE(NEW.features, '[]'::jsonb));
  
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.make, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.model, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.variant, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(features_text, '')), 'C');
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER cars_search_vector_trigger
BEFORE INSERT OR UPDATE ON cars
FOR EACH ROW EXECUTE FUNCTION cars_search_vector_update();

-- Populate search_vector for existing rows
UPDATE cars SET search_vector = (
  SELECT 
    setweight(to_tsvector('english', COALESCE(make, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(model, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(variant, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(
      (SELECT string_agg(value::text, ' ') FROM jsonb_array_elements_text(COALESCE(features, '[]'::jsonb))),
      ''
    )), 'C')
  FROM cars c WHERE c.id = cars.id
)
WHERE search_vector IS NULL;
`,

  '008_add_video_url': `
-- Migration: Add video_url column to cars table
-- This allows dealers to add YouTube or other video links to their listings

ALTER TABLE cars ADD COLUMN IF NOT EXISTS video_url VARCHAR(500);

-- Add comment for documentation
COMMENT ON COLUMN cars.video_url IS 'Optional video URL (YouTube, etc.) for the car listing';
`,

  '010_analytics_geo_indexes': `
-- Migration: Add GIN index on analytics_events metadata for geo queries
-- The metadata JSONB column stores country, city, region, timezone from CloudFront headers

CREATE INDEX IF NOT EXISTS idx_analytics_metadata_gin ON analytics_events USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_analytics_metadata_country ON analytics_events ((metadata->>'country'));
`
};

exports.handler = async (event) => {
  console.log('Starting migration...', event);
  
  // Determine which migration to run
  let migrationSQL;
  const migrationName = event.migrationName || event.migration;
  
  if (migrationName && MIGRATIONS[migrationName]) {
    migrationSQL = MIGRATIONS[migrationName];
    console.log(`Running predefined migration: ${migrationName}`);
  } else if (event.sql) {
    migrationSQL = event.sql;
    console.log('Running custom SQL migration');
  } else {
    // Default to search_vector migration for backwards compatibility
    migrationSQL = MIGRATIONS['006_search_vector'];
    console.log('Running default migration (006_search_vector)');
  }
  
  // Get database credentials from Secrets Manager
  const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION });
  const secretResponse = await secretsClient.send(
    new GetSecretValueCommand({ SecretId: process.env.SECRET_ARN })
  );
  
  const secret = JSON.parse(secretResponse.SecretString);
  
  const client = new Client({
    host: process.env.DB_HOST,
    port: 5432,
    database: process.env.DB_NAME,
    user: secret.username,
    password: secret.password,
    ssl: { rejectUnauthorized: true },
  });

  try {
    await client.connect();
    console.log('Connected to database');
    
    await client.query(migrationSQL);
    console.log('Migration completed successfully');
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Migration completed successfully',
        migration: migrationName || 'custom'
      })
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false, 
        error: error.message,
        code: error.code
      })
    };
  } finally {
    await client.end();
  }
};
