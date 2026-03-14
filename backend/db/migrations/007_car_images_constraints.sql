-- Migration 007: Add constraints and indexes to car_images table
-- Requirements: 10.3, 10.4, 10.6, 10.7

-- Add unique constraint on (car_id, order_index) to prevent duplicate ordering
ALTER TABLE car_images 
  ADD CONSTRAINT uq_car_images_car_order UNIQUE (car_id, order_index);

-- Add check constraint for non-negative order_index
ALTER TABLE car_images 
  ADD CONSTRAINT chk_car_images_order_nonnegative CHECK (order_index >= 0);

-- Add composite index for efficient ordering queries
CREATE INDEX idx_car_images_car_order ON car_images(car_id, order_index);

-- Add partial index for primary image lookups (only indexes rows where is_primary = true)
CREATE INDEX idx_car_images_primary ON car_images(car_id, is_primary) 
  WHERE is_primary = true;

-- Note: The schema does NOT enforce "exactly one primary image per car" via CHECK constraint
-- because PostgreSQL CHECK constraints cannot reference other rows. This invariant is enforced
-- by application logic in the service layer.
