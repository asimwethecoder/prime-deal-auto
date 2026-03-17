// Image upload API for car listings (admin only)

import { post } from './client';

export interface PresignedUploadUrlResponse {
  presignedUrl: string;
  s3Key: string;
  expiresAt: string;
}

export interface SaveImageMetadataResponse {
  id: string;
  carId: string;
  s3Key: string;
  url: string;
  isPrimary: boolean;
  orderIndex: number;
  createdAt: string;
}

/**
 * Get a presigned URL to upload an image to S3 (admin only).
 * After uploading with PUT to presignedUrl, call saveImageMetadata.
 */
export async function getImageUploadUrl(
  carId: string,
  filename: string,
  contentType: string
): Promise<PresignedUploadUrlResponse> {
  return post<PresignedUploadUrlResponse>(
    `/cars/${carId}/images/upload-url`,
    { filename, contentType }
  );
}

/**
 * Save image metadata after successful S3 upload (admin only).
 */
export async function saveImageMetadata(
  carId: string,
  s3Key: string,
  filename: string
): Promise<SaveImageMetadataResponse> {
  return post<SaveImageMetadataResponse>(`/cars/${carId}/images`, {
    s3Key,
    filename,
  });
}

/**
 * Set an image as the primary image for a car (admin only).
 */
export async function setPrimaryImage(
  carId: string,
  imageId: string
): Promise<{ id: string; carId: string; isPrimary: boolean }> {
  const { put } = await import('./client');
  return put<{ id: string; carId: string; isPrimary: boolean }>(
    `/cars/${carId}/images/${imageId}/primary`
  );
}

/**
 * Delete an image from a car (admin only).
 */
export async function deleteCarImage(
  carId: string,
  imageId: string
): Promise<{ deleted: boolean }> {
  const { del } = await import('./client');
  return del<{ deleted: boolean }>(`/cars/${carId}/images/${imageId}`);
}
