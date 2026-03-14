import { ImagesRepository } from '../repositories/images.repository';
import { CarRepository } from '../repositories/cars.repository';
import { generatePresignedUrl, deleteObject, getPublicUrl } from '../lib/s3';

export interface PresignedUploadUrl {
  presignedUrl: string;
  s3Key: string;
  expiresAt: string;
}

export interface ImageMetadata {
  id: string;
  carId: string;
  s3Key: string;
  url: string;
  isPrimary: boolean;
  orderIndex: number;
  createdAt: string;
}

export interface ReorderImageRequest {
  imageId: string;
  orderIndex: number;
}

export class ImagesService {
  private imagesRepo: ImagesRepository;
  private carRepo: CarRepository;
  private bucket: string;

  constructor() {
    this.imagesRepo = new ImagesRepository();
    this.carRepo = new CarRepository();
    this.bucket = process.env.S3_BUCKET || '';
  }

  /**
   * Generate a presigned URL for uploading an image to S3
   * @param carId - UUID of the car
   * @param filename - Original filename
   * @param contentType - MIME type (must be image/jpeg, image/png, or image/webp)
   * @returns Presigned URL, S3 key, and expiration timestamp
   */
  async generatePresignedUploadUrl(
    carId: string,
    filename: string,
    contentType: string
  ): Promise<PresignedUploadUrl> {
    // Validate content type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(contentType)) {
      throw new Error(
        `Invalid content type: ${contentType}. Must be image/jpeg, image/png, or image/webp.`
      );
    }

    // Validate car exists
    const car = await this.carRepo.findById(carId);
    if (!car) {
      throw new Error(`Car not found: ${carId}`);
    }

    // Validate car has fewer than 20 images
    const imageCount = await this.imagesRepo.countByCarId(carId);
    if (imageCount >= 20) {
      throw new Error('Car already has maximum of 20 images');
    }

    // Generate S3 key with timestamp to ensure uniqueness
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `cars/${carId}/${timestamp}-${sanitizedFilename}`;

    // Generate presigned URL
    const presignedUrl = await generatePresignedUrl(this.bucket, s3Key, contentType);

    // Calculate expiration time (5 minutes from now)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    return {
      presignedUrl,
      s3Key,
      expiresAt,
    };
  }

  /**
   * Save image metadata after successful S3 upload
   * @param carId - UUID of the car
   * @param s3Key - S3 object key
   * @param filename - Original filename
   * @returns Created image metadata
   */
  async saveImageMetadata(
    carId: string,
    s3Key: string,
    filename: string
  ): Promise<ImageMetadata> {
    // Validate S3 key format
    const expectedPrefix = `cars/${carId}/`;
    if (!s3Key.startsWith(expectedPrefix)) {
      throw new Error(`Invalid S3 key format. Expected prefix: ${expectedPrefix}`);
    }

    // Validate car exists
    const car = await this.carRepo.findById(carId);
    if (!car) {
      throw new Error(`Car not found: ${carId}`);
    }

    // Check if this is the first image for the car
    const existingImages = await this.imagesRepo.findByCarId(carId);
    const isPrimary = existingImages.length === 0;

    // Calculate order_index (max + 1)
    const maxOrderIndex = await this.imagesRepo.getMaxOrderIndex(carId);
    const orderIndex = maxOrderIndex + 1;

    // Generate public URL
    const url = getPublicUrl(this.bucket, s3Key);

    // Create metadata record
    const image = await this.imagesRepo.create({
      carId,
      s3Key,
      url,
      isPrimary,
      orderIndex,
    });

    return {
      id: image.id,
      carId: image.car_id,
      s3Key: image.s3_key,
      url: image.cloudfront_url || url,
      isPrimary: image.is_primary,
      orderIndex: image.order_index,
      createdAt: image.created_at,
    };
  }

  /**
   * Delete an image from S3 and database
   * If the deleted image was primary, promote the next image
   * @param imageId - UUID of the image to delete
   * @returns Object with deleted flag and promoted primary image ID (if applicable)
   */
  async deleteImage(imageId: string): Promise<{ deleted: boolean; promotedPrimaryImageId?: string }> {
    // Find the image
    const image = await this.imagesRepo.findById(imageId);
    if (!image) {
      // Idempotent - return success even if image doesn't exist
      return { deleted: true };
    }

    const wasPrimary = image.is_primary;
    const carId = image.car_id;

    // Delete from S3 (idempotent operation)
    await deleteObject(this.bucket, image.s3_key);

    // Delete from database
    await this.imagesRepo.delete(imageId);

    // If deleted image was primary, promote the next image
    let promotedPrimaryImageId: string | undefined;
    if (wasPrimary) {
      const nextImage = await this.imagesRepo.findLowestOrderImage(carId, imageId);
      if (nextImage) {
        await this.imagesRepo.updatePrimary(carId, nextImage.id);
        promotedPrimaryImageId = nextImage.id;
      }
    }

    return {
      deleted: true,
      promotedPrimaryImageId,
    };
  }

  /**
   * Set an image as the primary image for a car
   * @param carId - UUID of the car
   * @param imageId - UUID of the image to set as primary
   * @returns Updated image metadata
   */
  async setPrimaryImage(carId: string, imageId: string): Promise<ImageMetadata> {
    // Validate image exists and belongs to the car
    const image = await this.imagesRepo.findById(imageId);
    if (!image) {
      throw new Error(`Image not found: ${imageId}`);
    }
    if (image.car_id !== carId) {
      throw new Error(`Image ${imageId} does not belong to car ${carId}`);
    }

    // Update primary flag (transaction ensures exactly one primary)
    await this.imagesRepo.updatePrimary(carId, imageId);

    // Fetch updated image
    const updatedImage = await this.imagesRepo.findById(imageId);
    if (!updatedImage) {
      throw new Error('Failed to fetch updated image');
    }

    return {
      id: updatedImage.id,
      carId: updatedImage.car_id,
      s3Key: updatedImage.s3_key,
      url: updatedImage.cloudfront_url || getPublicUrl(this.bucket, updatedImage.s3_key),
      isPrimary: updatedImage.is_primary,
      orderIndex: updatedImage.order_index,
      createdAt: updatedImage.created_at,
    };
  }

  /**
   * Reorder images for a car
   * @param carId - UUID of the car
   * @param imageOrders - Array of image ID and order_index pairs
   * @returns Number of images updated
   */
  async reorderImages(carId: string, imageOrders: ReorderImageRequest[]): Promise<number> {
    // Validate all images belong to the car
    const imageIds = imageOrders.map((io) => io.imageId);
    const images = await Promise.all(imageIds.map((id) => this.imagesRepo.findById(id)));

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      if (!image) {
        throw new Error(`Image not found: ${imageIds[i]}`);
      }
      if (image.car_id !== carId) {
        throw new Error(`Image ${imageIds[i]} does not belong to car ${carId}`);
      }
    }

    // Validate order indices are sequential starting from 0
    const orderIndices = imageOrders.map((io) => io.orderIndex).sort((a, b) => a - b);
    for (let i = 0; i < orderIndices.length; i++) {
      if (orderIndices[i] !== i) {
        throw new Error(
          `Order indices must be sequential starting from 0. Expected ${i}, got ${orderIndices[i]}`
        );
      }
    }

    // Update order in transaction
    await this.imagesRepo.updateOrderBatch(imageOrders);

    return imageOrders.length;
  }
}
