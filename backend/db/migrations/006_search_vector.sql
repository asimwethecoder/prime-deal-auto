-- Migration 006: Add full-text search support with tsvector column
-- This migration adds PostgreSQL full-text search capabilities as a fallback
-- when OpenSearch is unavailable. It creates a tsvector column with GIN index
-- and a trigger to automatically update the search vector on INSERT/UPDATE.

-- Add tsvector column for full-text search
ALTER TABLE cars ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_cars_search_vector ON cars USING GIN(search_vector);

-- Drop existing trigger if it exists (for idempotent migration)
DROP TRIGGER IF EXISTS cars_search_vector_trigger ON cars;

-- Create trigger function to auto-update search_vector
-- Weights: A (highest) for make/model, B for variant, C for description/features
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

-- Create trigger to execute before INSERT or UPDATE
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

-- Verify the migration
-- This comment documents how to test the migration:
-- 1. Check column exists: \d cars
-- 2. Check index exists: \di idx_cars_search_vector
-- 3. Check trigger exists: \dft cars_search_vector_trigger
-- 4. Test search: SELECT * FROM cars WHERE search_vector @@ plainto_tsquery('english', 'toyota');
