# Design Document: Image Upload System

## Overview

The Image Upload System enables administrators to securely upload, manage, and organize car images for Prime Deal Auto's inventory. The system implements a presigned URL pattern where clients upload directly to S3, avoiding the need to proxy large files through Lambda. This design optimizes for cost, performance, and scalability while maintaining security through admin-only access controls.

### Key Design Decisions

1. **Presigned URL Pattern**: Direct browser-to-S3 uploads eliminate Lambda data transfer costs and improve upload performance
2. **Public S3 URLs**: Direct S3 URLs with public read access (CloudFront deferred due to account restrictions)
3. **Database-First Ordering**: Display order managed in PostgreSQL with unique constraints to prevent conflicts
4. **Atomic Operations**: Database transactions ensure consistency for multi-image operations (reorder, primary selection)
5. **Concurrent Upload Support**: Frontend manages up to 3 parallel uploads with independent progress tracking
6. **Idempotent Operations**: Delete and set-primary operations are safe to retry

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Admin Frontend                              │
│  ┌────────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │ ImageUploader  │  │ ImageGallery │  │  CarForm (Admin)       │  │
│  │  Component     │  │  Component   │  │                        │  │
│  └────────┬───────┘  └──────┬───────┘  └───────────┬────────────┘  │
│           │                  │                      │                │
└───────────┼──────────────────┼──────────────────────┼────────────────┘
            │                  │                      │
            │ 1. Request       │ 4. Display           │ 5. Manage
            │    Presigned URL │    Images            │    Images
            ▼                  ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       API Gateway (REST)                             │
│  POST /cars/:id/images/upload-url  (Admin Auth)                     │
│  POST /cars/:id/images             (Admin Auth)                     │
│  DELETE /cars/:id/images/:imageId  (Admin Auth)                     │
│  PUT /cars/:id/images/:imageId/primary (Admin Auth)                 │
│  PUT /cars/:id/images/reorder      (Admin Auth)                     │
│  GET /cars/:id                     (Public)                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Lambda Handler                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Handler Layer                                                │  │
│  │  - Parse request, validate auth, format response              │  │
│  └────────────────────────────┬─────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Service Layer                                                │  │
│  │  - Business logic, S3 presigned URL generation                │  │
│  │  - Primary image promotion, display order management          │  │
│  └────────────────────────────┬─────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Repository Layer                                             │  │
│  │  - Database queries, transactions                             │  │
│  └────────────────────────────┬─────────────────────────────────┘  │
└─────────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Aurora PostgreSQL (via RDS Proxy)                │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  car_images table                                            │  │
│  │  - id (UUID, PK)                                             │  │
│  │  - car_id (UUID, FK → cars.id, CASCADE DELETE)              │  │
│  │  - s3_key (VARCHAR)                                          │  │
│  │  - cloudfront_url (VARCHAR, nullable)                        │  │
│  │  - is_primary (BOOLEAN)                                      │  │
│  │  - order_index (INTEGER)                                     │  │
│  │  - created_at (TIMESTAMPTZ)                                  │  │
│  │  UNIQUE (car_id, order_index)                                │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

            2. Upload directly with presigned URL
            ┌──────────────────────────────────┐
            │                                  │
            ▼                                  │
┌─────────────────────────────────────────────┼───────────────────────┐
│                    S3 Bucket                │                        │
│  ┌──────────────────────────────────────────┼─────────────────────┐ │
│  │  cars/{carId}/{timestamp}-{filename}     │                     │ │
│  │  - Public read access                    │                     │ │
│  │  - CORS enabled for PUT from frontend    │                     │ │
│  │  - Lifecycle: delete incomplete uploads  │                     │ │
│  └──────────────────────────────────────────┼─────────────────────┘ │
└─────────────────────────────────────────────┼───────────────────────┘
                                              │
                                              │ 3. Read images
                                              │    (public URLs)
                                              └────────────────────────┐
                                                                       │
                                                                       ▼
                                                            ┌──────────────────┐
                                                            │  Public Users    │
                                                            │  (Car Detail)    │
                                                            └──────────────────┘
```

### Upload Flow Sequence

1. **Admin requests upload URL**:
   - Frontend: User selects image file(s)
   - Frontend: Validates file type (JPEG/PNG/WebP) and size (<5MB)
   - Frontend: Calls `POST /cars/:carId/images/upload-url` with filename
   - Backend: Validates car exists and has <20 images
   - Backend: Generates S3 key: `cars/{carId}/{timestamp}-{filename}`
   - Backend: Creates presigned URL (5-minute expiration, PUT only, Content-Type restricted)
   - Backend: Returns `{ presignedUrl, s3Key, expiresAt }`

2. **Frontend uploads to S3**:
   - Frontend: Uses XMLHttpRequest to PUT file to presigned URL
   - Frontend: Tracks upload progress via `xhr.upload.onprogress`
   - S3: Validates Content-Type matches presigned URL restriction
   - S3: Stores file at specified key

3. **Frontend confirms upload**:
   - Frontend: Calls `POST /cars/:carId/images` with `{ s3Key, filename }`
   - Backend: Validates S3 key format
   - Backend: Creates metadata record in `car_images` table
   - Backend: Sets `is_primary=true` if first image for car
   - Backend: Sets `order_index` to max+1
   - Backend: Returns complete image metadata

4. **Display in gallery**:
   - Frontend: Fetches car details via `GET /cars/:carId`
   - Backend: Returns car with images ordered by `order_index`
   - Frontend: Displays images with primary image first

## Architecture

### Component Hierarchy

```
frontend/
├── components/
│   ├── admin/
│   │   ├── ImageUploader.tsx          # Main upload component
│   │   │   ├── FileDropzone           # Drag-and-drop zone
│   │   │   ├── ImagePreviewGrid       # Thumbnail grid with reorder
│   │   │   ├── UploadProgressBar      # Per-file progress
│   │   │   └── ImageActions           # Delete, set primary buttons
│   │   └── CarForm.tsx                # Integrates ImageUploader
│   └── cars/
│       └── ImageGallery.tsx           # Public image viewer
│           ├── MainImageDisplay       # Large image view
│           ├── ThumbnailStrip         # Clickable thumbnails
│           └── NavigationControls     # Prev/next buttons
└── lib/
    ├── api/
    │   └── images.ts                  # API client functions
    └── hooks/
        ├── useImageUpload.ts          # Upload mutation hook
        ├── useImageDelete.ts          # Delete mutation hook
        ├── useSetPrimaryImage.ts      # Set primary mutation hook
        └── useReorderImages.ts        # Reorder mutation hook

backend/
├── src/
│   ├── handlers/
│   │   └── images.handler.ts          # HTTP request handlers
│   ├── services/
│   │   └── images.service.ts          # Business logic
│   ├── repositories/
│   │   └── images.repository.ts       # Database queries
│   └── lib/
│       └── s3.ts                      # S3 client wrapper
```

### State Management

**TanStack Query** manages all server state:
- Query keys: `['cars', carId, 'images']`
- Mutations invalidate car queries to refresh image lists
- Optimistic updates for reorder operations (instant UI feedback)

**Local Component State** (React useState):
- File selection state
- Upload progress per file
- Drag-and-drop reorder preview
- Error messages

## Components and Interfaces

### API Endpoints

#### POST /cars/:carId/images/upload-url

Generate presigned URL for direct S3 upload.

**Auth**: Admin only (Cognito authorizer + admin group check)

**Request**:
```typescript
POST /cars/abc-123/images/upload-url
Content-Type: application/json

{
  "filename": "front-view.jpg",
  "contentType": "image/jpeg"
}
```

**Response** (200 OK):
```typescript
{
  "success": true,
  "data": {
    "presignedUrl": "https://bucket.s3.amazonaws.com/cars/abc-123/1234567890-front-view.jpg?X-Amz-...",
    "s3Key": "cars/abc-123/1234567890-front-view.jpg",
    "expiresAt": "2025-01-15T10:35:00Z"
  }
}
```

**Errors**:
- 401 UNAUTHORIZED: Not authenticated
- 403 FORBIDDEN: Not admin
- 404 NOT_FOUND: Car does not exist
- 400 VALIDATION_ERROR: Car already has 20 images
- 400 VALIDATION_ERROR: Invalid content type

#### POST /cars/:carId/images

Save image metadata after successful S3 upload.

**Auth**: Admin only

**Request**:
```typescript
POST /cars/abc-123/images
Content-Type: application/json

{
  "s3Key": "cars/abc-123/1234567890-front-view.jpg",
  "filename": "front-view.jpg"
}
```

**Response** (201 Created):
```typescript
{
  "success": true,
  "data": {
    "id": "img-uuid-123",
    "carId": "abc-123",
    "s3Key": "cars/abc-123/1234567890-front-view.jpg",
    "url": "https://bucket.s3.amazonaws.com/cars/abc-123/1234567890-front-view.jpg",
    "isPrimary": true,
    "orderIndex": 0,
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

**Errors**:
- 401 UNAUTHORIZED: Not authenticated
- 403 FORBIDDEN: Not admin
- 404 NOT_FOUND: Car does not exist
- 400 VALIDATION_ERROR: Invalid S3 key format
- 400 VALIDATION_ERROR: Car already has 20 images

#### DELETE /cars/:carId/images/:imageId

Delete image from S3 and database.

**Auth**: Admin only

**Request**:
```typescript
DELETE /cars/abc-123/images/img-uuid-123
```

**Response** (200 OK):
```typescript
{
  "success": true,
  "data": {
    "deleted": true,
    "promotedPrimaryImageId": "img-uuid-456" // If deleted image was primary
  }
}
```

**Errors**:
- 401 UNAUTHORIZED: Not authenticated
- 403 FORBIDDEN: Not admin
- 404 NOT_FOUND: Image does not exist

**Idempotence**: Returns 200 even if image already deleted

#### PUT /cars/:carId/images/:imageId/primary

Set image as primary for the car.

**Auth**: Admin only

**Request**:
```typescript
PUT /cars/abc-123/images/img-uuid-123/primary
```

**Response** (200 OK):
```typescript
{
  "success": true,
  "data": {
    "id": "img-uuid-123",
    "carId": "abc-123",
    "isPrimary": true,
    "orderIndex": 2
  }
}
```

**Errors**:
- 401 UNAUTHORIZED: Not authenticated
- 403 FORBIDDEN: Not admin
- 404 NOT_FOUND: Image does not exist
- 400 VALIDATION_ERROR: Image does not belong to specified car

#### PUT /cars/:carId/images/reorder

Update display order for multiple images.

**Auth**: Admin only

**Request**:
```typescript
PUT /cars/abc-123/images/reorder
Content-Type: application/json

{
  "imageOrders": [
    { "imageId": "img-uuid-123", "orderIndex": 0 },
    { "imageId": "img-uuid-456", "orderIndex": 1 },
    { "imageId": "img-uuid-789", "orderIndex": 2 }
  ]
}
```

**Response** (200 OK):
```typescript
{
  "success": true,
  "data": {
    "updated": 3
  }
}
```

**Errors**:
- 401 UNAUTHORIZED: Not authenticated
- 403 FORBIDDEN: Not admin
- 400 VALIDATION_ERROR: Image IDs do not all belong to specified car
- 400 VALIDATION_ERROR: Order indices are not sequential starting from 0

### TypeScript Interfaces

```typescript
// Shared types
export interface CarImage {
  id: string;
  carId: string;
  s3Key: string;
  url: string;
  thumbnailUrl?: string;
  isPrimary: boolean;
  orderIndex: number;
  createdAt: string;
}

export interface PresignedUploadUrl {
  presignedUrl: string;
  s3Key: string;
  expiresAt: string;
}

export interface ImageUploadProgress {
  file: File;
  s3Key?: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

// API request/response types
export interface GenerateUploadUrlRequest {
  filename: string;
  contentType: string;
}

export interface SaveImageMetadataRequest {
  s3Key: string;
  filename: string;
}

export interface ReorderImagesRequest {
  imageOrders: Array<{
    imageId: string;
    orderIndex: number;
  }>;
}

// Repository types
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
```

## Data Models

### Database Schema Updates

The `car_images` table already exists in `schema.sql` but needs modifications:

**Current Schema**:
```sql
CREATE TABLE car_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  s3_key VARCHAR(500) NOT NULL,
  cloudfront_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_car_images_car_id ON car_images(car_id);
```

**Required Changes** (Migration 007):
```sql
-- Add unique constraint on (car_id, order_index)
ALTER TABLE car_images 
  ADD CONSTRAINT uq_car_images_car_order UNIQUE (car_id, order_index);

-- Add check constraint for non-negative order_index
ALTER TABLE car_images 
  ADD CONSTRAINT chk_car_images_order_nonnegative CHECK (order_index >= 0);

-- Add composite index for efficient ordering queries
CREATE INDEX idx_car_images_car_order ON car_images(car_id, order_index);

-- Add index for primary image lookups
CREATE INDEX idx_car_images_primary ON car_images(car_id, is_primary) 
  WHERE is_primary = true;
```

**Note**: The schema does NOT enforce "exactly one primary image per car" via CHECK constraint because PostgreSQL CHECK constraints cannot reference other rows. This invariant is enforced by application logic in the service layer.

### S3 Bucket Configuration

**Bucket Name**: Managed by CDK (auto-generated or from StorageStack)

**Folder Structure**:
```
cars/
  {carId}/
    {timestamp}-{filename}
```

**Example**:
```
cars/
  abc-123-def-456/
    1705315800000-front-view.jpg
    1705315801000-rear-view.jpg
    1705315802000-interior.jpg
```

**Bucket Policies**:
- Public read access on `cars/*` prefix
- Block public write access (uploads only via presigned URLs)
- Server-side encryption (AES-256)
- CORS configuration:
  ```json
  {
    "AllowedOrigins": ["https://primedealauto.com", "http://localhost:3000"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
  ```

**Lifecycle Policy**:
- Delete incomplete multipart uploads after 1 day
- No versioning (cost optimization)

### Presigned URL Configuration

```typescript
// S3 presigned URL parameters
{
  Bucket: process.env.S3_BUCKET,
  Key: `cars/${carId}/${timestamp}-${filename}`,
  Expires: 300, // 5 minutes
  ContentType: contentType, // Enforces MIME type
  ACL: 'public-read', // Makes uploaded file publicly readable
}
```

**Security**:
- 5-minute expiration prevents URL reuse
- Content-Type restriction prevents uploading non-image files
- ACL ensures uploaded files are publicly readable
- No AWS credentials exposed to frontend

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

Before defining properties, I've analyzed the requirements to eliminate redundancy:

**Redundancies Identified**:
1. Properties 1.1 and 1.2 (presigned URL generation) can be combined into a single property about presigned URL format
2. Properties 2.1 and 2.2 (metadata storage) can be combined into a single property about complete metadata records
3. Properties 3.1 and 3.2 (deletion) can be combined into a single property about complete deletion
4. Properties 4.1 and 4.2 (primary image setting) can be combined into a single property about primary flag updates
5. Properties 6.1 and 6.8 (file type validation) are redundant - 6.8 subsumes 6.1
6. Property 9.3 is duplicate of 1.9 (S3 key format)
7. Properties 11.7 and 11.8 (display order sequentiality) can be combined

**Final Property Set** (after removing redundancies):

### Property 1: Presigned URL Generation Format

*For any* valid car and filename, generating a presigned URL SHALL return a response containing a presigned URL, S3 key in format `cars/{carId}/{timestamp}-{filename}`, and expiration timestamp 5 minutes in the future.

**Validates: Requirements 1.1, 1.2, 1.9**

### Property 2: Presigned URL Read-Only

*For any* presigned URL generation request, the operation SHALL NOT modify any database state (no INSERT, UPDATE, or DELETE operations).

**Validates: Requirements 1.10**

### Property 3: Complete Metadata Storage

*For any* successful S3 upload confirmation, saving metadata SHALL create a record containing s3_key, url, car_id, is_primary flag, order_index, and created_at timestamp.

**Validates: Requirements 2.1, 2.2, 2.8**

### Property 4: Sequential Display Order Assignment

*For any* car with N existing images, adding a new image SHALL assign order_index = N (one greater than current maximum).

**Validates: Requirements 2.4**

### Property 5: Metadata Immediate Visibility

*For any* successfully saved image metadata, querying the car's images SHALL immediately include the new image in the results.

**Validates: Requirements 2.9**

### Property 6: Complete Image Deletion

*For any* image deletion request, the operation SHALL remove both the S3 file and the database metadata record.

**Validates: Requirements 3.1, 3.2**

### Property 7: Primary Image Promotion on Deletion

*For any* car with multiple images, deleting the primary image SHALL promote the image with the lowest order_index to primary.

**Validates: Requirements 3.3**

### Property 8: Deletion Idempotence

*For any* image, deleting it multiple times SHALL produce the same result (image is gone, operation returns success).

**Validates: Requirements 3.7**

### Property 9: Deleted Image Invisibility

*For any* successfully deleted image, subsequent queries for the car's images SHALL NOT include the deleted image.

**Validates: Requirements 3.8**

### Property 10: Primary Image Uniqueness

*For any* car with at least one image, exactly one image SHALL have is_primary = true after any image operation (upload, delete, set primary, reorder).

**Validates: Requirements 4.7**

### Property 11: Primary Image First in Gallery

*For any* car with images, querying the car SHALL return the primary image first in the ordered list, regardless of its order_index value.

**Validates: Requirements 4.8**

### Property 12: Reorder Atomicity

*For any* reorder operation, either all order_index updates succeed together, or none succeed (atomic transaction).

**Validates: Requirements 5.7**

### Property 13: Reorder Consistency

*For any* successful reorder operation, querying the car's images SHALL return images in the new order_index sequence.

**Validates: Requirements 5.8**

### Property 14: File Type Validation

*For any* file upload attempt, files with Content-Type other than image/jpeg, image/png, or image/webp SHALL be rejected.

**Validates: Requirements 6.1, 6.8**

### Property 15: File Size Validation

*For any* file upload attempt, files larger than 5 MB SHALL be rejected with VALIDATION_ERROR.

**Validates: Requirements 6.2**

### Property 16: Public Image Access

*For any* uploaded image, the S3 URL SHALL be publicly accessible without authentication.

**Validates: Requirements 9.8**

### Property 17: Cascade Delete Integrity

*For any* car deletion, all associated image metadata records SHALL be deleted (cascade delete via foreign key).

**Validates: Requirements 10.2**

### Property 18: Foreign Key Integrity

*For any* image metadata record, the car_id SHALL reference an existing car in the cars table.

**Validates: Requirements 10.8**

### Property 19: Concurrent Upload Safety

*For any* set of concurrent metadata save requests for the same car, the final order_index values SHALL be sequential without gaps or duplicates.

**Validates: Requirements 11.6, 11.7, 11.8**

### Property 20: Failed Upload Isolation

*For any* batch of concurrent uploads, one upload failure SHALL NOT prevent other uploads from completing successfully.

**Validates: Requirements 11.4**

### Property 21: Presigned URL Performance

*For any* presigned URL generation request, Lambda execution time SHALL be under 200 milliseconds.

**Validates: Requirements 15.1, 15.7**

### Property 22: Image Operation Performance

*For any* image operation (save metadata, delete, set primary, reorder), Lambda execution time SHALL be under 1 second excluding S3 upload time.

**Validates: Requirements 15.8**

## Error Handling

### Error Response Format

All errors follow the standard API format:

```typescript
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

### Error Codes

| Code | HTTP Status | Scenario | User Action |
|------|-------------|----------|-------------|
| UNAUTHORIZED | 401 | No auth token or invalid token | Log in again |
| FORBIDDEN | 403 | Not admin user | Contact administrator |
| NOT_FOUND | 404 | Car or image does not exist | Verify ID is correct |
| VALIDATION_ERROR | 400 | Invalid input (file type, size, format) | Fix input and retry |
| RATE_LIMITED | 429 | Too many requests | Wait and retry |
| INTERNAL_ERROR | 500 | Unexpected server error | Retry or contact support |

### Error Scenarios

#### Frontend Validation Errors

**Invalid File Type**:
```typescript
{
  "success": false,
  "error": "File type not supported. Please upload JPEG, PNG, or WebP images.",
  "code": "VALIDATION_ERROR"
}
```

**File Too Large**:
```typescript
{
  "success": false,
  "error": "File size exceeds 5 MB limit. Please compress the image and try again.",
  "code": "VALIDATION_ERROR"
}
```

**Too Many Images**:
```typescript
{
  "success": false,
  "error": "Car already has maximum of 20 images. Please delete some images before uploading more.",
  "code": "VALIDATION_ERROR"
}
```

#### S3 Upload Errors

**Presigned URL Expired**:
- S3 returns 403 AccessDenied
- Frontend detects and shows: "Upload link expired. Please try again."
- User can retry to get new presigned URL

**Network Error During Upload**:
- XMLHttpRequest fails with network error
- Frontend shows: "Network error. Please check your connection and retry."
- Retry button generates new presigned URL and restarts upload

**S3 Content-Type Mismatch**:
- S3 rejects upload if Content-Type doesn't match presigned URL restriction
- Frontend shows: "File type validation failed. Please ensure you're uploading an image file."

#### Backend Errors

**Orphaned S3 File** (metadata save fails after successful S3 upload):
- Log S3 key to CloudWatch for manual cleanup
- Return error to frontend: "Failed to save image metadata. Please try again."
- S3 lifecycle policy will delete orphaned files after 1 day if not cleaned up manually

**Database Transaction Failure** (reorder operation):
- Rollback all changes
- Return error: "Failed to reorder images. Please try again."
- No partial updates due to transaction atomicity

**Concurrent Primary Image Update**:
- Use database transaction with row-level locking
- If conflict detected, retry transaction
- Return error only if retries exhausted: "Failed to set primary image. Please try again."

### Error Recovery Strategies

**Frontend**:
- Retry button for network errors
- Clear error state when user selects new files
- Show specific error messages per file in multi-upload
- Allow removing failed uploads from queue without affecting successful ones

**Backend**:
- Idempotent operations (delete, set primary) safe to retry
- Database transactions ensure consistency
- Structured logging for debugging (request ID, user ID, car ID, error details)

**Infrastructure**:
- S3 lifecycle policy cleans up incomplete uploads
- CloudWatch alarms for high error rates
- Dead letter queue for failed Lambda invocations (future enhancement)

## Testing Strategy

### Dual Testing Approach

The Image Upload System requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific examples (first image becomes primary, deleting last image)
- Edge cases (empty car, single image, maximum 20 images)
- Error conditions (invalid file type, expired presigned URL)
- Integration points (S3 client, database transactions)

**Property-Based Tests** focus on:
- Universal properties across all inputs (display order sequentiality, primary image uniqueness)
- Comprehensive input coverage through randomization (random car IDs, random file counts)
- Invariant preservation (foreign key integrity, cascade deletes)
- Concurrency safety (parallel uploads, race conditions)

### Property-Based Testing Configuration

**Library**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: image-upload-system, Property {number}: {property_text}`

**Example Property Test**:
```typescript
import fc from 'fast-check';

// Feature: image-upload-system, Property 10: Primary Image Uniqueness
test('exactly one primary image per car after any operation', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.uuid(), // Random car ID
      fc.array(fc.uuid(), { minLength: 1, maxLength: 20 }), // Random image IDs
      async (carId, imageIds) => {
        // Setup: Create car with images
        await setupCarWithImages(carId, imageIds);
        
        // Perform random operation (upload, delete, set primary)
        const operation = fc.sample(fc.constantFrom('upload', 'delete', 'setPrimary'), 1)[0];
        await performOperation(operation, carId, imageIds);
        
        // Assert: Exactly one primary image
        const images = await getCarImages(carId);
        const primaryCount = images.filter(img => img.isPrimary).length;
        expect(primaryCount).toBe(1);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Test Coverage

**Handler Tests** (`backend/tests/unit/handlers/images.handler.test.ts`):
- Auth validation (admin only)
- Request parsing and validation
- Response formatting
- Error handling

**Service Tests** (`backend/tests/unit/services/images.service.test.ts`):
- Presigned URL generation
- Primary image promotion logic
- Display order calculation
- Reorder validation

**Repository Tests** (`backend/tests/unit/repositories/images.repository.test.ts`):
- CRUD operations
- Transaction handling
- Query correctness

**Frontend Component Tests** (`frontend/components/admin/__tests__/ImageUploader.test.tsx`):
- File selection and validation
- Upload progress tracking
- Drag-and-drop reordering
- Error message display

### Integration Tests

**E2E Upload Flow** (Playwright):
1. Admin logs in
2. Navigates to car edit page
3. Selects image files
4. Uploads images
5. Verifies images appear in gallery
6. Reorders images via drag-and-drop
7. Sets primary image
8. Deletes an image
9. Verifies changes persist after page reload

**API Integration Tests** (Vitest):
- Full upload flow (generate URL → upload to S3 → save metadata)
- Concurrent upload handling
- Transaction rollback on errors
- S3 client integration (mocked)

### Test Data Generators

**For Property-Based Tests**:
```typescript
// Generate random car with images
const carWithImagesArbitrary = fc.record({
  carId: fc.uuid(),
  images: fc.array(
    fc.record({
      id: fc.uuid(),
      s3Key: fc.string().map(s => `cars/${fc.uuid()}/${Date.now()}-${s}.jpg`),
      isPrimary: fc.boolean(),
      orderIndex: fc.nat(),
    }),
    { minLength: 0, maxLength: 20 }
  ),
});

// Generate random valid image file
const imageFileArbitrary = fc.record({
  filename: fc.string().map(s => `${s}.jpg`),
  contentType: fc.constantFrom('image/jpeg', 'image/png', 'image/webp'),
  size: fc.integer({ min: 1, max: 5 * 1024 * 1024 }), // Up to 5MB
});

// Generate random invalid image file (for error testing)
const invalidImageFileArbitrary = fc.oneof(
  fc.record({
    filename: fc.string().map(s => `${s}.pdf`),
    contentType: fc.constant('application/pdf'),
    size: fc.integer({ min: 1, max: 5 * 1024 * 1024 }),
  }),
  fc.record({
    filename: fc.string().map(s => `${s}.jpg`),
    contentType: fc.constant('image/jpeg'),
    size: fc.integer({ min: 5 * 1024 * 1024 + 1, max: 10 * 1024 * 1024 }), // Over 5MB
  })
);
```

### Performance Testing

**Load Tests** (Artillery or k6):
- Concurrent presigned URL generation (100 requests/second)
- Concurrent metadata saves (50 requests/second)
- Large file uploads (5MB files)
- Measure Lambda cold start vs warm invocation times

**Benchmarks**:
- Presigned URL generation: <200ms (Property 21)
- Metadata save: <500ms (Property 22)
- Image delete: <500ms (Property 22)
- Reorder operation: <1s for 20 images (Property 22)

### Security Testing

**Auth Tests**:
- Verify non-admin users cannot access endpoints
- Verify unauthenticated requests are rejected
- Verify presigned URLs expire after 5 minutes
- Verify presigned URLs enforce Content-Type

**Input Validation Tests**:
- SQL injection attempts in filenames
- Path traversal attempts in S3 keys
- Oversized file uploads
- Invalid MIME types

### Test Execution

**Local Development**:
```bash
# Unit tests
npm test

# Property-based tests
npm test -- --grep "Property"

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

**CI/CD Pipeline** (future):
- Run unit tests on every commit
- Run property-based tests on every PR
- Run integration tests before deployment
- Run E2E tests after deployment to staging

---

This design document provides a comprehensive technical specification for implementing the Image Upload System. The next phase is to create the implementation tasks based on this design.
