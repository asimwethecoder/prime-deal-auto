/**
 * Lambda function to run database migrations
 * This runs inside the VPC and can access the RDS Proxy
 */

const { Client } = require('pg');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const MIGRATION_SQL = `
-- Migration 006: Add full-text search support with tsvector column

-- Add tsvector column for full-text search
ALTER TABLE cars ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_cars_search_vector ON cars USING GIN(search_vector);

-- Drop existing trigger if it exists (for idempotent migration)
DROP TRIGGER IF EXISTS cars_search_vector_trigger ON cars;

-- Create trigger function to auto-update search_vector
CREATE OR REPLACE FUNCTION cars_search_vector_update() RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql;

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
`;

exports.handler = async (event) => {
  console.log('Starting migration...');
  
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
    
    await client.query(MIGRATION_SQL);
    console.log('Migration completed successfully');
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Migration completed successfully' })
    };
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
};
