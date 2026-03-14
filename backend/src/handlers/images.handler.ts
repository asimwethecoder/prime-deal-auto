import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ImagesService } from '../services/images.service';
import { success, error } from '../lib/response';

// Initialize service outside handler for reuse across warm invocations
const imagesService = new ImagesService();

/**
 * Check if user is authenticated and has admin role
 * @param event - API Gateway event
 * @returns True if user is admin, false otherwise
 */
function isAdmin(event: APIGatewayProxyEvent): boolean {
  const claims = event.requestContext.authorizer?.claims;
  if (!claims) {
    return false;
  }

  const groups = claims['cognito:groups'] || '';
  return groups.includes('admin');
}

/**
 * POST /cars/:carId/images/upload-url
 * Generate presigned URL for uploading an image to S3
 * 
 * Auth: Admin only
 * 
 * Request body:
 * {
 *   "filename": "front-view.jpg",
 *   "contentType": "image/jpeg"
 * }
 * 
 * Response:
 * {
 *   "presignedUrl": "https://...",
 *   "s3Key": "cars/abc-123/1234567890-front-view.jpg",
 *   "expiresAt": "2025-01-15T10:35:00Z"
 * }
 */
export async function handleGenerateUploadUrl(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    // Check authentication
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
      return error('Authentication required', 'UNAUTHORIZED', 401);
    }

    // Check admin access
    if (!isAdmin(event)) {
      return error('Forbidden: Admin access required', 'FORBIDDEN', 403);
    }

    // Parse path parameters
    const carId = event.pathParameters?.carId;
    if (!carId) {
      return error('Missing carId parameter', 'VALIDATION_ERROR', 400);
    }

    // Parse request body
    if (!event.body) {
      return error('Missing request body', 'VALIDATION_ERROR', 400);
    }

    const body = JSON.parse(event.body);
    const { filename, contentType } = body;

    if (!filename || !contentType) {
      return error('Missing filename or contentType', 'VALIDATION_ERROR', 400);
    }

    // Generate presigned URL
    const result = await imagesService.generatePresignedUploadUrl(
      carId,
      filename,
      contentType
    );

    return success(result);
  } catch (err) {
    console.error('Error generating presigned URL:', err);

    if (err instanceof Error) {
      if (err.message.includes('not found')) {
        return error(err.message, 'NOT_FOUND', 404);
      }
      if (err.message.includes('Invalid content type') || err.message.includes('maximum')) {
        return error(err.message, 'VALIDATION_ERROR', 400);
      }
    }

    return error('Failed to generate upload URL', 'INTERNAL_ERROR', 500);
  }
}

/**
 * POST /cars/:carId/images
 * Save image metadata after successful S3 upload
 * 
 * Auth: Admin only
 * 
 * Request body:
 * {
 *   "s3Key": "cars/abc-123/1234567890-front-view.jpg",
 *   "filename": "front-view.jpg"
 * }
 * 
 * Response (201):
 * {
 *   "id": "img-uuid-123",
 *   "carId": "abc-123",
 *   "s3Key": "cars/abc-123/1234567890-front-view.jpg",
 *   "url": "https://...",
 *   "isPrimary": true,
 *   "orderIndex": 0,
 *   "createdAt": "2025-01-15T10:30:00Z"
 * }
 */
export async function handleSaveImageMetadata(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    // Check authentication
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
      return error('Authentication required', 'UNAUTHORIZED', 401);
    }

    // Check admin access
    if (!isAdmin(event)) {
      return error('Forbidden: Admin access required', 'FORBIDDEN', 403);
    }

    // Parse path parameters
    const carId = event.pathParameters?.carId;
    if (!carId) {
      return error('Missing carId parameter', 'VALIDATION_ERROR', 400);
    }

    // Parse request body
    if (!event.body) {
      return error('Missing request body', 'VALIDATION_ERROR', 400);
    }

    const body = JSON.parse(event.body);
    const { s3Key, filename } = body;

    if (!s3Key || !filename) {
      return error('Missing s3Key or filename', 'VALIDATION_ERROR', 400);
    }

    // Save metadata
    const result = await imagesService.saveImageMetadata(carId, s3Key, filename);

    return success(result, 201);
  } catch (err) {
    console.error('Error saving image metadata:', err);

    if (err instanceof Error) {
      if (err.message.includes('not found')) {
        return error(err.message, 'NOT_FOUND', 404);
      }
      if (err.message.includes('Invalid S3 key')) {
        return error(err.message, 'VALIDATION_ERROR', 400);
      }
    }

    return error('Failed to save image metadata', 'INTERNAL_ERROR', 500);
  }
}

/**
 * DELETE /cars/:carId/images/:imageId
 * Delete image from S3 and database
 * 
 * Auth: Admin only
 * 
 * Response:
 * {
 *   "deleted": true,
 *   "promotedPrimaryImageId": "img-uuid-456" // Optional, if deleted image was primary
 * }
 */
export async function handleDeleteImage(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    // Check authentication
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
      return error('Authentication required', 'UNAUTHORIZED', 401);
    }

    // Check admin access
    if (!isAdmin(event)) {
      return error('Forbidden: Admin access required', 'FORBIDDEN', 403);
    }

    // Parse path parameters
    const imageId = event.pathParameters?.imageId;
    if (!imageId) {
      return error('Missing imageId parameter', 'VALIDATION_ERROR', 400);
    }

    // Delete image
    const result = await imagesService.deleteImage(imageId);

    return success(result);
  } catch (err) {
    console.error('Error deleting image:', err);
    return error('Failed to delete image', 'INTERNAL_ERROR', 500);
  }
}

/**
 * PUT /cars/:carId/images/:imageId/primary
 * Set image as primary for the car
 * 
 * Auth: Admin only
 * 
 * Response:
 * {
 *   "id": "img-uuid-123",
 *   "carId": "abc-123",
 *   "isPrimary": true,
 *   "orderIndex": 2
 * }
 */
export async function handleSetPrimaryImage(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    // Check authentication
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
      return error('Authentication required', 'UNAUTHORIZED', 401);
    }

    // Check admin access
    if (!isAdmin(event)) {
      return error('Forbidden: Admin access required', 'FORBIDDEN', 403);
    }

    // Parse path parameters
    const carId = event.pathParameters?.carId;
    const imageId = event.pathParameters?.imageId;

    if (!carId || !imageId) {
      return error('Missing carId or imageId parameter', 'VALIDATION_ERROR', 400);
    }

    // Set primary image
    const result = await imagesService.setPrimaryImage(carId, imageId);

    return success(result);
  } catch (err) {
    console.error('Error setting primary image:', err);

    if (err instanceof Error) {
      if (err.message.includes('not found')) {
        return error(err.message, 'NOT_FOUND', 404);
      }
      if (err.message.includes('does not belong')) {
        return error(err.message, 'VALIDATION_ERROR', 400);
      }
    }

    return error('Failed to set primary image', 'INTERNAL_ERROR', 500);
  }
}

/**
 * PUT /cars/:carId/images/reorder
 * Update display order for multiple images
 * 
 * Auth: Admin only
 * 
 * Request body:
 * {
 *   "imageOrders": [
 *     { "imageId": "img-uuid-123", "orderIndex": 0 },
 *     { "imageId": "img-uuid-456", "orderIndex": 1 },
 *     { "imageId": "img-uuid-789", "orderIndex": 2 }
 *   ]
 * }
 * 
 * Response:
 * {
 *   "updated": 3
 * }
 */
export async function handleReorderImages(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    // Check authentication
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
      return error('Authentication required', 'UNAUTHORIZED', 401);
    }

    // Check admin access
    if (!isAdmin(event)) {
      return error('Forbidden: Admin access required', 'FORBIDDEN', 403);
    }

    // Parse path parameters
    const carId = event.pathParameters?.carId;
    if (!carId) {
      return error('Missing carId parameter', 'VALIDATION_ERROR', 400);
    }

    // Parse request body
    if (!event.body) {
      return error('Missing request body', 'VALIDATION_ERROR', 400);
    }

    const body = JSON.parse(event.body);
    const { imageOrders } = body;

    if (!imageOrders || !Array.isArray(imageOrders)) {
      return error('Missing or invalid imageOrders array', 'VALIDATION_ERROR', 400);
    }

    // Validate each order entry
    for (const order of imageOrders) {
      if (!order.imageId || typeof order.orderIndex !== 'number') {
        return error('Invalid imageOrders format', 'VALIDATION_ERROR', 400);
      }
    }

    // Reorder images
    const updated = await imagesService.reorderImages(carId, imageOrders);

    return success({ updated });
  } catch (err) {
    console.error('Error reordering images:', err);

    if (err instanceof Error) {
      if (err.message.includes('not found')) {
        return error(err.message, 'NOT_FOUND', 404);
      }
      if (
        err.message.includes('does not belong') ||
        err.message.includes('sequential')
      ) {
        return error(err.message, 'VALIDATION_ERROR', 400);
      }
    }

    return error('Failed to reorder images', 'INTERNAL_ERROR', 500);
  }
}
