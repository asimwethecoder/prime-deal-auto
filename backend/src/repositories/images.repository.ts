import { getPool } from '../lib/database';

export interface CarImage {
  id: string;
  car_id: string;
  s3_key: string;
  cloudfront_url: string | null;
  thumbnail_url: string | null;
  is_primary: boolean;
  order_index: number;
  created_at: string;
}

export interface CreateImageRecord {
  carId: string;
  s3Key: string;
  url: string;
  isPrimary: boolean;
  orderIndex: number;
}

export interface UpdateImageOrder {
  imageId: string;
  orderIndex: number;
}

export class ImagesRepository {
  /**
   * Find all images for a car, ordered by order_index
   * @param carId - UUID of the car
   * @returns Array of images ordered by order_index
   */
  async findByCarId(carId: string): Promise<CarImage[]> {
    const pool = await getPool();
    const result = await pool.query(
      `SELECT * FROM car_images 
       WHERE car_id = $1 
       ORDER BY order_index ASC`,
      [carId]
    );
    return result.rows;
  }

  /**
   * Find a single image by ID
   * @param imageId - UUID of the image
   * @returns Image record or null if not found
   */
  async findById(imageId: string): Promise<CarImage | null> {
    const pool = await getPool();
    const result = await pool.query(
      'SELECT * FROM car_images WHERE id = $1',
      [imageId]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new image metadata record
   * @param data - Image metadata to insert
   * @returns Created image record
   */
  async create(data: CreateImageRecord): Promise<CarImage> {
    const pool = await getPool();
    const result = await pool.query(
      `INSERT INTO car_images (car_id, s3_key, cloudfront_url, is_primary, order_index)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.carId, data.s3Key, data.url, data.isPrimary, data.orderIndex]
    );
    return result.rows[0];
  }

  /**
   * Delete an image record
   * @param imageId - UUID of the image to delete
   * @returns True if deleted, false if not found
   */
  async delete(imageId: string): Promise<boolean> {
    const pool = await getPool();
    const result = await pool.query(
      'DELETE FROM car_images WHERE id = $1',
      [imageId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Set an image as primary for a car
   * Uses transaction to ensure exactly one primary image
   * @param carId - UUID of the car
   * @param imageId - UUID of the image to set as primary
   */
  async updatePrimary(carId: string, imageId: string): Promise<void> {
    const pool = await getPool();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Unset all primary flags for this car
      await client.query(
        'UPDATE car_images SET is_primary = false WHERE car_id = $1',
        [carId]
      );
      
      // Set the specified image as primary
      await client.query(
        'UPDATE car_images SET is_primary = true WHERE id = $1 AND car_id = $2',
        [imageId, carId]
      );
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update display order for multiple images in a transaction
   * @param updates - Array of image ID and order_index pairs
   */
  async updateOrderBatch(updates: UpdateImageOrder[]): Promise<void> {
    const pool = await getPool();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update each image's order_index
      for (const update of updates) {
        await client.query(
          'UPDATE car_images SET order_index = $1 WHERE id = $2',
          [update.orderIndex, update.imageId]
        );
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get the maximum order_index for a car's images
   * @param carId - UUID of the car
   * @returns Maximum order_index or -1 if no images
   */
  async getMaxOrderIndex(carId: string): Promise<number> {
    const pool = await getPool();
    const result = await pool.query(
      'SELECT COALESCE(MAX(order_index), -1) as max_order FROM car_images WHERE car_id = $1',
      [carId]
    );
    return parseInt(result.rows[0].max_order, 10);
  }

  /**
   * Count images for a car
   * @param carId - UUID of the car
   * @returns Number of images
   */
  async countByCarId(carId: string): Promise<number> {
    const pool = await getPool();
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM car_images WHERE car_id = $1',
      [carId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Find the image with the lowest order_index for a car (excluding a specific image)
   * Used for promoting a new primary image after deletion
   * @param carId - UUID of the car
   * @param excludeImageId - UUID of image to exclude (optional)
   * @returns Image with lowest order_index or null if no images
   */
  async findLowestOrderImage(carId: string, excludeImageId?: string): Promise<CarImage | null> {
    const pool = await getPool();
    
    if (excludeImageId) {
      const result = await pool.query(
        `SELECT * FROM car_images 
         WHERE car_id = $1 AND id != $2 
         ORDER BY order_index ASC 
         LIMIT 1`,
        [carId, excludeImageId]
      );
      return result.rows[0] || null;
    } else {
      const result = await pool.query(
        `SELECT * FROM car_images 
         WHERE car_id = $1 
         ORDER BY order_index ASC 
         LIMIT 1`,
        [carId]
      );
      return result.rows[0] || null;
    }
  }
}
