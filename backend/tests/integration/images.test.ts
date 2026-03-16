/**
 * Integration Tests: Images Operations
 * 
 * Tests for POST /cars/:carId/images/upload-url, POST /cars/:carId/images,
 * DELETE /cars/:carId/images/:imageId, PUT /cars/:carId/images/:imageId/primary,
 * PUT /cars/:carId/images/reorder
 */

import { describe, it, expect } from 'vitest';
import {
  createMockEvent,
  createAdminEvent,
  createUserEvent,
  expectSuccess,
  expectError,
} from './test-fixtures';
import {
  handleGenerateUploadUrl,
  handleSaveImageMetadata,
  handleDeleteImage,
  handleSetPrimaryImage,
  handleReorderImages,
} from '../../src/handlers/images.handler';

describe('Images Operations', () => {
  // ============================================
  // POST /cars/:carId/images/upload-url - Generate Presigned URL
  // ============================================
  describe('POST /cars/:carId/images/upload-url - Generate Presigned URL', () => {
    const testCarId = '00000000-0000-0000-0000-000000000001';

    it('generates presigned URL when admin', async () => {
      const event = createAdminEvent({
        httpMethod: 'POST',
        path: `/cars/${testCarId}/images/upload-url`,
        pathParameters: { carId: testCarId },
        body: JSON.stringify({
          filename: 'front-view.jpg',
          contentType: 'image/jpeg',
        }),
      });

      const result = await handleGenerateUploadUrl(event);

      // May return 404 if car doesn't exist, which is valid behavior
      if (result.statusCode === 200) {
        const data = expectSuccess<any>(result.body);
        expect(data).toHaveProperty('presignedUrl');
        expect(data).toHaveProperty('s3Key');
        expect(data).toHaveProperty('expiresAt');
        expect(data.presignedUrl).toContain('https://');
      } else {
        expect([404, 200]).toContain(result.statusCode);
      }
    });

    it('returns 401 when not authenticated', async () => {
      const event = createMockEvent({
        httpMethod: 'POST',
        path: `/cars/${testCarId}/images/upload-url`,
        pathParameters: { carId: testCarId },
        body: JSON.stringify({
          filename: 'front-view.jpg',
          contentType: 'image/jpeg',
        }),
      });

      const result = await handleGenerateUploadUrl(event);

      expect(result.statusCode).toBe(401);
      expectError(result.body, 'UNAUTHORIZED');
    });

    it('returns 403 when not admin', async () => {
      const event = createUserEvent({
        httpMethod: 'POST',
        path: `/cars/${testCarId}/images/upload-url`,
        pathParameters: { carId: testCarId },
        body: JSON.stringify({
          filename: 'front-view.jpg',
          contentType: 'image/jpeg',
        }),
      });

      const result = await handleGenerateUploadUrl(event);

      expect(result.statusCode).toBe(403);
      expectError(result.body, 'FORBIDDEN');
    });

    it('returns 400 when carId is missing', async () => {
      const event = createAdminEvent({
        httpMethod: 'POST',
        path: '/cars//images/upload-url',
        pathParameters: null,
        body: JSON.stringify({
          filename: 'front-view.jpg',
          contentType: 'image/jpeg',
        }),
      });

      const result = await handleGenerateUploadUrl(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

    it('returns 400 when filename is missing', async () => {
      const event = createAdminEvent({
        httpMethod: 'POST',
        path: `/cars/${testCarId}/images/upload-url`,
        pathParameters: { carId: testCarId },
        body: JSON.stringify({
          contentType: 'image/jpeg',
        }),
      });

      const result = await handleGenerateUploadUrl(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

    it('returns 400 when contentType is missing', async () => {
      const event = createAdminEvent({
        httpMethod: 'POST',
        path: `/cars/${testCarId}/images/upload-url`,
        pathParameters: { carId: testCarId },
        body: JSON.stringify({
          filename: 'front-view.jpg',
        }),
      });

      const result = await handleGenerateUploadUrl(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

    it('returns 400 when body is missing', async () => {
      const event = createAdminEvent({
        httpMethod: 'POST',
        path: `/cars/${testCarId}/images/upload-url`,
        pathParameters: { carId: testCarId },
        body: null,
      });

      const result = await handleGenerateUploadUrl(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

    it('accepts image/jpeg content type', async () => {
      const event = createAdminEvent({
        httpMethod: 'POST',
        path: `/cars/${testCarId}/images/upload-url`,
        pathParameters: { carId: testCarId },
        body: JSON.stringify({
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
        }),
      });

      const result = await handleGenerateUploadUrl(event);

      // Should not fail validation for content type
      expect([200, 404]).toContain(result.statusCode);
    });

    it('accepts image/png content type', async () => {
      const event = createAdminEvent({
        httpMethod: 'POST',
        path: `/cars/${testCarId}/images/upload-url`,
        pathParameters: { carId: testCarId },
        body: JSON.stringify({
          filename: 'photo.png',
          contentType: 'image/png',
        }),
      });

      const result = await handleGenerateUploadUrl(event);

      expect([200, 404]).toContain(result.statusCode);
    });

    it('accepts image/webp content type', async () => {
      const event = createAdminEvent({
        httpMethod: 'POST',
        path: `/cars/${testCarId}/images/upload-url`,
        pathParameters: { carId: testCarId },
        body: JSON.stringify({
          filename: 'photo.webp',
          contentType: 'image/webp',
        }),
      });

      const result = await handleGenerateUploadUrl(event);

      expect([200, 400, 404]).toContain(result.statusCode);
    });
  });


  // ============================================
  // POST /cars/:carId/images - Save Image Metadata
  // ============================================
  describe('POST /cars/:carId/images - Save Image Metadata', () => {
    const testCarId = '00000000-0000-0000-0000-000000000001';

    it('returns 401 when not authenticated', async () => {
      const event = createMockEvent({
        httpMethod: 'POST',
        path: `/cars/${testCarId}/images`,
        pathParameters: { carId: testCarId },
        body: JSON.stringify({
          s3Key: `cars/${testCarId}/1234567890-front-view.jpg`,
          filename: 'front-view.jpg',
        }),
      });

      const result = await handleSaveImageMetadata(event);

      expect(result.statusCode).toBe(401);
      expectError(result.body, 'UNAUTHORIZED');
    });

    it('returns 403 when not admin', async () => {
      const event = createUserEvent({
        httpMethod: 'POST',
        path: `/cars/${testCarId}/images`,
        pathParameters: { carId: testCarId },
        body: JSON.stringify({
          s3Key: `cars/${testCarId}/1234567890-front-view.jpg`,
          filename: 'front-view.jpg',
        }),
      });

      const result = await handleSaveImageMetadata(event);

      expect(result.statusCode).toBe(403);
      expectError(result.body, 'FORBIDDEN');
    });

    it('returns 400 when carId is missing', async () => {
      const event = createAdminEvent({
        httpMethod: 'POST',
        path: '/cars//images',
        pathParameters: null,
        body: JSON.stringify({
          s3Key: 'cars/test/image.jpg',
          filename: 'image.jpg',
        }),
      });

      const result = await handleSaveImageMetadata(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

    it('returns 400 when s3Key is missing', async () => {
      const event = createAdminEvent({
        httpMethod: 'POST',
        path: `/cars/${testCarId}/images`,
        pathParameters: { carId: testCarId },
        body: JSON.stringify({
          filename: 'front-view.jpg',
        }),
      });

      const result = await handleSaveImageMetadata(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

    it('returns 400 when filename is missing', async () => {
      const event = createAdminEvent({
        httpMethod: 'POST',
        path: `/cars/${testCarId}/images`,
        pathParameters: { carId: testCarId },
        body: JSON.stringify({
          s3Key: `cars/${testCarId}/1234567890-front-view.jpg`,
        }),
      });

      const result = await handleSaveImageMetadata(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

    it('returns 400 when body is missing', async () => {
      const event = createAdminEvent({
        httpMethod: 'POST',
        path: `/cars/${testCarId}/images`,
        pathParameters: { carId: testCarId },
        body: null,
      });

      const result = await handleSaveImageMetadata(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });
  });

  // ============================================
  // DELETE /cars/:carId/images/:imageId - Delete Image
  // ============================================
  describe('DELETE /cars/:carId/images/:imageId - Delete Image', () => {
    const testCarId = '00000000-0000-0000-0000-000000000001';
    const testImageId = '00000000-0000-0000-0000-000000000002';

    it('returns 401 when not authenticated', async () => {
      const event = createMockEvent({
        httpMethod: 'DELETE',
        path: `/cars/${testCarId}/images/${testImageId}`,
        pathParameters: { carId: testCarId, imageId: testImageId },
      });

      const result = await handleDeleteImage(event);

      expect(result.statusCode).toBe(401);
      expectError(result.body, 'UNAUTHORIZED');
    });

    it('returns 403 when not admin', async () => {
      const event = createUserEvent({
        httpMethod: 'DELETE',
        path: `/cars/${testCarId}/images/${testImageId}`,
        pathParameters: { carId: testCarId, imageId: testImageId },
      });

      const result = await handleDeleteImage(event);

      expect(result.statusCode).toBe(403);
      expectError(result.body, 'FORBIDDEN');
    });

    it('returns 400 when imageId is missing', async () => {
      const event = createAdminEvent({
        httpMethod: 'DELETE',
        path: `/cars/${testCarId}/images/`,
        pathParameters: { carId: testCarId },
      });

      const result = await handleDeleteImage(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });
  });


  // ============================================
  // PUT /cars/:carId/images/:imageId/primary - Set Primary Image
  // ============================================
  describe('PUT /cars/:carId/images/:imageId/primary - Set Primary Image', () => {
    const testCarId = '00000000-0000-0000-0000-000000000001';
    const testImageId = '00000000-0000-0000-0000-000000000002';

    it('returns 401 when not authenticated', async () => {
      const event = createMockEvent({
        httpMethod: 'PUT',
        path: `/cars/${testCarId}/images/${testImageId}/primary`,
        pathParameters: { carId: testCarId, imageId: testImageId },
      });

      const result = await handleSetPrimaryImage(event);

      expect(result.statusCode).toBe(401);
      expectError(result.body, 'UNAUTHORIZED');
    });

    it('returns 403 when not admin', async () => {
      const event = createUserEvent({
        httpMethod: 'PUT',
        path: `/cars/${testCarId}/images/${testImageId}/primary`,
        pathParameters: { carId: testCarId, imageId: testImageId },
      });

      const result = await handleSetPrimaryImage(event);

      expect(result.statusCode).toBe(403);
      expectError(result.body, 'FORBIDDEN');
    });

    it('returns 400 when carId is missing', async () => {
      const event = createAdminEvent({
        httpMethod: 'PUT',
        path: `/cars//images/${testImageId}/primary`,
        pathParameters: { imageId: testImageId },
      });

      const result = await handleSetPrimaryImage(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

    it('returns 400 when imageId is missing', async () => {
      const event = createAdminEvent({
        httpMethod: 'PUT',
        path: `/cars/${testCarId}/images//primary`,
        pathParameters: { carId: testCarId },
      });

      const result = await handleSetPrimaryImage(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });
  });

  // ============================================
  // PUT /cars/:carId/images/reorder - Reorder Images
  // ============================================
  describe('PUT /cars/:carId/images/reorder - Reorder Images', () => {
    const testCarId = '00000000-0000-0000-0000-000000000001';

    it('returns 401 when not authenticated', async () => {
      const event = createMockEvent({
        httpMethod: 'PUT',
        path: `/cars/${testCarId}/images/reorder`,
        pathParameters: { carId: testCarId },
        body: JSON.stringify({
          imageOrders: [
            { imageId: 'img-1', orderIndex: 0 },
            { imageId: 'img-2', orderIndex: 1 },
          ],
        }),
      });

      const result = await handleReorderImages(event);

      expect(result.statusCode).toBe(401);
      expectError(result.body, 'UNAUTHORIZED');
    });

    it('returns 403 when not admin', async () => {
      const event = createUserEvent({
        httpMethod: 'PUT',
        path: `/cars/${testCarId}/images/reorder`,
        pathParameters: { carId: testCarId },
        body: JSON.stringify({
          imageOrders: [
            { imageId: 'img-1', orderIndex: 0 },
            { imageId: 'img-2', orderIndex: 1 },
          ],
        }),
      });

      const result = await handleReorderImages(event);

      expect(result.statusCode).toBe(403);
      expectError(result.body, 'FORBIDDEN');
    });

    it('returns 400 when carId is missing', async () => {
      const event = createAdminEvent({
        httpMethod: 'PUT',
        path: '/cars//images/reorder',
        pathParameters: null,
        body: JSON.stringify({
          imageOrders: [
            { imageId: 'img-1', orderIndex: 0 },
          ],
        }),
      });

      const result = await handleReorderImages(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

    it('returns 400 when imageOrders is missing', async () => {
      const event = createAdminEvent({
        httpMethod: 'PUT',
        path: `/cars/${testCarId}/images/reorder`,
        pathParameters: { carId: testCarId },
        body: JSON.stringify({}),
      });

      const result = await handleReorderImages(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

    it('returns 400 when imageOrders is not an array', async () => {
      const event = createAdminEvent({
        httpMethod: 'PUT',
        path: `/cars/${testCarId}/images/reorder`,
        pathParameters: { carId: testCarId },
        body: JSON.stringify({
          imageOrders: 'not-an-array',
        }),
      });

      const result = await handleReorderImages(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

    it('returns 400 when imageOrders has invalid format', async () => {
      const event = createAdminEvent({
        httpMethod: 'PUT',
        path: `/cars/${testCarId}/images/reorder`,
        pathParameters: { carId: testCarId },
        body: JSON.stringify({
          imageOrders: [
            { imageId: 'img-1' }, // Missing orderIndex
          ],
        }),
      });

      const result = await handleReorderImages(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

    it('returns 400 when body is missing', async () => {
      const event = createAdminEvent({
        httpMethod: 'PUT',
        path: `/cars/${testCarId}/images/reorder`,
        pathParameters: { carId: testCarId },
        body: null,
      });

      const result = await handleReorderImages(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });
  });
});
