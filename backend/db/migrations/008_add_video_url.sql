-- Migration: Add video_url column to cars table
-- This allows dealers to add YouTube or other video links to their listings

ALTER TABLE cars ADD COLUMN IF NOT EXISTS video_url VARCHAR(500);

-- Add comment for documentation
COMMENT ON COLUMN cars.video_url IS 'Optional video URL (YouTube, etc.) for the car listing';
