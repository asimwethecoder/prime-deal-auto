# Implementation Plan: Image Upload System

## Overview

This implementation plan breaks down the Image Upload System into discrete coding tasks. The system enables administrators to upload, manage, and organize car images using presigned S3 URLs for direct browser-to-S3 uploads. Implementation follows a bottom-up approach: database schema → backend API → frontend components → integration → testing.

## Tasks

- [x] 1. Database schema migration
  - Create migration 007 with unique constraints and indexes
  - Add unique constraint on (car_id, order_index)
  - Add check constraint for non-negative order_index
  - Add composite index on (car_id, order_index)
  - Add partial index on (car_id, is_primary) WHERE is_primary = true
  - _Requirements: 10.1, 10.3, 10.4, 10.6, 10.7_

- [x] 2. Update S3 bucket configuration
  - [x] 2.1 Add CORS configuration to StorageStack
    - Configure CORS to allow PUT requests from frontend domain
    - Set allowed origins to include localhost:3000 and production domain
    - Set allowed methods to PUT and GET
    - Set allowed headers to wildcard
    - Set max age to 3000 seconds
    - _Requirements: 9.7_
  
  - [x] 2.2 Add lifecycle policy for incomplete uploads
    - Create lifecycle rule to delete incomplete multipart uploads after 1 day
    - Apply rule to entire bucket
    - _Requirements: 9.2_
  
  - [x] 2.3 Verify public read access on cars/* prefix
    - Ensure bucket policy allows public GetObject on cars/* prefix
    - Verify block public write access is enabled
    - _Requirements: 9.1, 9.6, 9.8_

- [x] 3. Implement backend images repository
  - [x] 3.1 Create images.repository.ts with CRUD operations
    - Implement findByCarId(carId) to fetch all images for a car ordered by order_index
    - Implement findById(imageId) to fetch single image
    - Implement create(data) to insert new image metadata
    - Implement delete(imageId) to remove image record
    - Implement updatePrimary(carId, imageId) to set primary image
    - Implement updateOrderBatch(updates) to reorder multiple images in transaction
    - Implement getMaxOrderIndex(carId) to find highest order_index for a car
    - Implement countByCarId(carId) to count images for a car
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 5.1_
  
  - [ ]* 3.2 Write unit tests for images repository
    - Test findByCarId returns images in order_index order
    - Test create sets correct order_index for first and subsequent images
    - Test updatePrimary sets exactly one primary image
    - Test updateOrderBatch maintains unique constraint
    - Test delete removes record
    - Test countByCarId returns accurate count
    - _Requirements: 2.9, 4.7, 5.8, 10.3_

- [x] 4. Implement backend images service
  - [x] 4.1 Create images.service.ts with business logic
    - Implement generatePresignedUrl(carId, filename, contentType) function
    - Generate S3 key with format: cars/{carId}/{timestamp}-{filename}
    - Create presigned URL with 5-minute expiration, PUT method, Content-Type restriction
    - Validate car exists before generating URL
    - Validate car has fewer than 20 images
    - Implement saveImageMetadata(carId, s3Key, filename) function
    - Validate S3 key format matches expected pattern
    - Set is_primary=true if first image for car
    - Calculate order_index as max+1
    - Implement deleteImage(imageId) function
    - Delete S3 file using S3 client
    - Delete database record
    - Promote next image to primary if deleted image was primary
    - Implement setPrimaryImage(carId, imageId) function
    - Validate image belongs to car
    - Update is_primary flags in transaction
    - Implement reorderImages(carId, imageOrders) function
    - Validate all image IDs belong to car
    - Validate order indices are sequential starting from 0
    - Update order_index values in transaction
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3_
  
  - [ ]* 4.2 Write unit tests for images service
    - Test generatePresignedUrl returns valid URL with correct expiration
    - Test generatePresignedUrl rejects non-existent car
    - Test generatePresignedUrl rejects car with 20 images
    - Test saveImageMetadata sets first image as primary
    - Test saveImageMetadata assigns sequential order_index
    - Test deleteImage promotes next image when primary deleted
    - Test setPrimaryImage updates exactly one primary flag
    - Test reorderImages validates sequential indices
    - Test reorderImages validates all images belong to car
    - _Requirements: 1.1, 1.5, 1.6, 2.3, 2.4, 3.3, 4.3, 4.5, 5.2, 5.4, 5.5_

- [x] 5. Create S3 client wrapper
  - [x] 5.1 Create lib/s3.ts with S3 operations
    - Initialize S3Client outside handler for connection reuse
    - Implement generatePresignedUrl(bucket, key, contentType) function
    - Use getSignedUrl from @aws-sdk/s3-request-presigner
    - Set expiration to 300 seconds (5 minutes)
    - Restrict to PUT method and specified Content-Type
    - Set ACL to public-read
    - Implement deleteObject(bucket, key) function
    - Use DeleteObjectCommand
    - Handle errors gracefully (return success even if object doesn't exist)
    - _Requirements: 1.1, 1.8, 3.1, 3.7_
  
  - [ ]* 5.2 Write unit tests for S3 client wrapper
    - Test generatePresignedUrl returns valid URL format
    - Test generatePresignedUrl includes correct parameters
    - Test deleteObject handles non-existent objects gracefully
    - Mock S3Client to avoid actual AWS calls
    - _Requirements: 1.1, 3.7_

- [x] 6. Implement backend images handler
  - [x] 6.1 Create handlers/images.handler.ts with 5 endpoint handlers
    - Implement handleGenerateUploadUrl(event) for POST /cars/:carId/images/upload-url
    - Parse carId from path parameters
    - Parse filename and contentType from request body
    - Validate user is admin (check cognito:groups)
    - Call imagesService.generatePresignedUrl()
    - Return presignedUrl, s3Key, expiresAt
    - Implement handleSaveImageMetadata(event) for POST /cars/:carId/images
    - Parse carId from path parameters
    - Parse s3Key and filename from request body
    - Validate user is admin
    - Call imagesService.saveImageMetadata()
    - Return complete image metadata with 201 status
    - Implement handleDeleteImage(event) for DELETE /cars/:carId/images/:imageId
    - Parse carId and imageId from path parameters
    - Validate user is admin
    - Call imagesService.deleteImage()
    - Return success with promotedPrimaryImageId if applicable
    - Implement handleSetPrimaryImage(event) for PUT /cars/:carId/images/:imageId/primary
    - Parse carId and imageId from path parameters
    - Validate user is admin
    - Call imagesService.setPrimaryImage()
    - Return updated image metadata
    - Implement handleReorderImages(event) for PUT /cars/:carId/images/reorder
    - Parse carId from path parameters
    - Parse imageOrders array from request body
    - Validate user is admin
    - Call imagesService.reorderImages()
    - Return count of updated images
    - Add all handlers to main lambda.ts router
    - _Requirements: 1.7, 2.7, 3.5, 4.6, 5.6_
  
  - [ ]* 6.2 Write unit tests for images handler
    - Test all handlers reject non-admin users with 403
    - Test handleGenerateUploadUrl validates request body
    - Test handleSaveImageMetadata returns 201 on success
    - Test handleDeleteImage returns 200 even if image doesn't exist
    - Test handleSetPrimaryImage validates image belongs to car
    - Test handleReorderImages validates sequential order indices
    - Mock imagesService to isolate handler logic
    - _Requirements: 1.7, 2.7, 3.5, 4.6, 5.6_

- [x] 7. Update existing car queries to include images
  - [x] 7.1 Modify cars.repository.ts to join car_images table
    - Update findById(carId) to LEFT JOIN car_images
    - Order images by order_index ASC
    - Return images array with each car
    - Update findAll(filters) to LEFT JOIN car_images for primary image only
    - Include only is_primary=true image in listing results
    - _Requirements: 13.1, 13.2_
  
  - [ ]* 7.2 Write unit tests for updated car queries
    - Test findById returns images in correct order
    - Test findById returns primary image first
    - Test findAll includes primary image for each car
    - Test queries handle cars with no images gracefully
    - _Requirements: 13.1, 13.2_

- [x] 8. Checkpoint - Ensure backend tests pass
  - Run all backend unit tests
  - Verify database migration applies cleanly
  - Test API endpoints manually with Postman or curl
  - Ensure all tests pass, ask the user if questions arise

- [ ] 9. Implement frontend API client functions
  - [ ] 9.1 Create lib/api/images.ts with API functions
    - Implement generateUploadUrl(carId, filename, contentType) function
    - POST to /cars/:carId/images/upload-url
    - Return PresignedUploadUrl type
    - Implement uploadToS3(presignedUrl, file, onProgress) function
    - Use XMLHttpRequest for progress tracking
    - Set Content-Type header to match file type
    - Call onProgress callback with percentage
    - Return promise that resolves on success
    - Implement saveImageMetadata(carId, s3Key, filename) function
    - POST to /cars/:carId/images
    - Return CarImage type
    - Implement deleteImage(carId, imageId) function
    - DELETE to /cars/:carId/images/:imageId
    - Return success response
    - Implement setPrimaryImage(carId, imageId) function
    - PUT to /cars/:carId/images/:imageId/primary
    - Return updated CarImage
    - Implement reorderImages(carId, imageOrders) function
    - PUT to /cars/:carId/images/reorder
    - Return success response
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_
  
  - [ ] 9.2 Create TypeScript interfaces in lib/api/types.ts
    - Add CarImage interface
    - Add PresignedUploadUrl interface
    - Add ImageUploadProgress interface
    - Add GenerateUploadUrlRequest interface
    - Add SaveImageMetadataRequest interface
    - Add ReorderImagesRequest interface
    - _Requirements: All requirements (type safety)_

- [ ] 10. Implement TanStack Query hooks
  - [ ] 10.1 Create hooks/use-image-upload.ts
    - Export useImageUpload() hook
    - Use useMutation with mutationFn that calls generateUploadUrl → uploadToS3 → saveImageMetadata
    - Track upload progress in local state
    - Invalidate ['cars', carId, 'images'] query on success
    - Handle errors and expose error state
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 14.7_
  
  - [ ] 10.2 Create hooks/use-image-delete.ts
    - Export useImageDelete() hook
    - Use useMutation with mutationFn that calls deleteImage
    - Invalidate ['cars', carId, 'images'] query on success
    - Implement optimistic update to remove image from UI immediately
    - _Requirements: 3.1, 3.2, 14.7_
  
  - [ ] 10.3 Create hooks/use-set-primary-image.ts
    - Export useSetPrimaryImage() hook
    - Use useMutation with mutationFn that calls setPrimaryImage
    - Invalidate ['cars', carId, 'images'] query on success
    - Implement optimistic update to move image to first position
    - _Requirements: 4.1, 4.2, 14.7_
  
  - [ ] 10.4 Create hooks/use-reorder-images.ts
    - Export useReorderImages() hook
    - Use useMutation with mutationFn that calls reorderImages
    - Invalidate ['cars', carId, 'images'] query on success
    - Implement optimistic update to reorder images in UI immediately
    - _Requirements: 5.1, 14.7_

- [ ] 11. Implement ImageUploader component
  - [ ] 11.1 Create components/admin/ImageUploader.tsx
    - Accept carId prop (required)
    - Fetch existing images using useQuery(['cars', carId, 'images'])
    - Implement file selection with input type="file" multiple accept="image/*"
    - Validate file type (JPEG, PNG, WebP) on selection
    - Validate file size (<5MB) on selection
    - Display validation errors for invalid files
    - Implement drag-and-drop file selection using onDrop handler
    - Highlight drop zone on dragOver
    - Display thumbnail previews for selected files using FileReader
    - Show upload progress bar for each file
    - Support concurrent uploads (max 3 at a time)
    - Display success/error state for each upload
    - Allow cancellation of in-progress uploads
    - Display existing images in grid with thumbnails
    - Show primary image badge on primary image
    - Show order_index number on each thumbnail
    - Implement drag-and-drop reordering using react-beautiful-dnd or similar
    - Call useReorderImages on drop
    - Add "Set as Primary" button on each image
    - Call useSetPrimaryImage on click
    - Add "Delete" button on each image
    - Call useImageDelete on click with confirmation dialog
    - Disable upload button when car has 20 images
    - Show warning message when limit reached
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6, 6.7, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 11.1, 11.2, 11.3, 11.4, 11.5, 14.6_
  
  - [ ]* 11.2 Write component tests for ImageUploader
    - Test file selection triggers validation
    - Test invalid file type shows error message
    - Test oversized file shows error message
    - Test drag-and-drop file selection works
    - Test upload progress displays correctly
    - Test successful upload shows success indicator
    - Test failed upload shows error message
    - Test reorder updates display order
    - Test set primary updates primary badge
    - Test delete removes image from grid
    - Test 20-image limit disables upload
    - Mock TanStack Query hooks
    - _Requirements: 6.5, 6.6, 6.7, 7.3, 7.4, 8.4, 11.3, 11.4, 11.5_

- [ ] 12. Update ImageGallery component for public display
  - [ ] 12.1 Modify components/cars/ImageGallery.tsx
    - Accept images prop (array of CarImage)
    - Display primary image first regardless of order_index
    - Display remaining images in order_index order
    - Implement thumbnail strip with click handlers
    - Implement previous/next navigation buttons
    - Implement keyboard navigation (arrow keys)
    - Use next/image for optimized image loading
    - Implement lazy loading for off-screen images
    - Use responsive image sizing based on viewport
    - Ensure primary image is visible without scrolling
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 15.5, 15.6_
  
  - [ ]* 12.2 Write component tests for ImageGallery
    - Test primary image displays first
    - Test thumbnail click changes main image
    - Test previous/next buttons navigate correctly
    - Test arrow keys navigate images
    - Test lazy loading works for off-screen images
    - Test component handles empty images array
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.6_

- [ ] 13. Integrate ImageUploader into admin car form
  - [ ] 13.1 Update components/admin/CarForm.tsx
    - Import ImageUploader component
    - Add ImageUploader below car details fields
    - Disable ImageUploader when carId is null (new car not yet saved)
    - Show message: "Save car details first to upload images"
    - Enable ImageUploader after car is saved and carId is available
    - Display warning badge if car has no primary image
    - Allow form submission without images (images optional)
    - Refresh image list after successful uploads
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.8_
  
  - [ ]* 13.2 Write integration tests for car form with images
    - Test ImageUploader is disabled for new cars
    - Test ImageUploader is enabled after car is saved
    - Test warning displays when no primary image
    - Test form can be saved without images
    - Test image uploads refresh the list
    - _Requirements: 14.3, 14.4, 14.5, 14.6_

- [ ] 14. Checkpoint - Ensure frontend tests pass
  - Run all frontend component tests
  - Test ImageUploader manually in browser
  - Test ImageGallery on car detail page
  - Test admin car form integration
  - Ensure all tests pass, ask the user if questions arise

- [ ] 15. Implement property-based tests
  - [ ]* 15.1 Write property test for presigned URL format (Property 1)
    - **Property 1: Presigned URL Generation Format**
    - **Validates: Requirements 1.1, 1.2, 1.9**
    - Generate random valid carId and filename
    - Call generatePresignedUrl
    - Assert response contains presignedUrl, s3Key, expiresAt
    - Assert s3Key matches format cars/{carId}/{timestamp}-{filename}
    - Assert expiresAt is approximately 5 minutes in future
    - Run 100 iterations with fast-check
  
  - [ ]* 15.2 Write property test for presigned URL read-only (Property 2)
    - **Property 2: Presigned URL Read-Only**
    - **Validates: Requirements 1.10**
    - Generate random valid carId and filename
    - Count database records before generatePresignedUrl
    - Call generatePresignedUrl
    - Count database records after
    - Assert counts are equal (no INSERT/UPDATE/DELETE)
    - Run 100 iterations
  
  - [ ]* 15.3 Write property test for complete metadata storage (Property 3)
    - **Property 3: Complete Metadata Storage**
    - **Validates: Requirements 2.1, 2.2, 2.8**
    - Generate random carId, s3Key, filename
    - Call saveImageMetadata
    - Query database for created record
    - Assert record contains all required fields
    - Run 100 iterations
  
  - [ ]* 15.4 Write property test for sequential order assignment (Property 4)
    - **Property 4: Sequential Display Order Assignment**
    - **Validates: Requirements 2.4**
    - Generate random carId with N existing images
    - Call saveImageMetadata to add new image
    - Assert new image has order_index = N
    - Run 100 iterations
  
  - [ ]* 15.5 Write property test for metadata immediate visibility (Property 5)
    - **Property 5: Metadata Immediate Visibility**
    - **Validates: Requirements 2.9**
    - Generate random carId and image data
    - Call saveImageMetadata
    - Immediately query car images
    - Assert new image appears in results
    - Run 100 iterations
  
  - [ ]* 15.6 Write property test for complete deletion (Property 6)
    - **Property 6: Complete Image Deletion**
    - **Validates: Requirements 3.1, 3.2**
    - Generate random carId with images
    - Call deleteImage
    - Assert S3 file is deleted (mock S3 client)
    - Assert database record is deleted
    - Run 100 iterations
  
  - [ ]* 15.7 Write property test for primary promotion on deletion (Property 7)
    - **Property 7: Primary Image Promotion on Deletion**
    - **Validates: Requirements 3.3**
    - Generate random carId with multiple images
    - Mark one image as primary
    - Delete the primary image
    - Assert image with lowest order_index is now primary
    - Run 100 iterations
  
  - [ ]* 15.8 Write property test for deletion idempotence (Property 8)
    - **Property 8: Deletion Idempotence**
    - **Validates: Requirements 3.7**
    - Generate random imageId
    - Delete image first time
    - Delete same image second time
    - Assert both operations return success
    - Assert image is gone after both operations
    - Run 100 iterations
  
  - [ ]* 15.9 Write property test for deleted image invisibility (Property 9)
    - **Property 9: Deleted Image Invisibility**
    - **Validates: Requirements 3.8**
    - Generate random carId with images
    - Delete one image
    - Query car images
    - Assert deleted image does not appear in results
    - Run 100 iterations
  
  - [ ]* 15.10 Write property test for primary image uniqueness (Property 10)
    - **Property 10: Primary Image Uniqueness**
    - **Validates: Requirements 4.7**
    - Generate random carId with images
    - Perform random operation (upload, delete, setPrimary, reorder)
    - Query car images
    - Assert exactly one image has is_primary=true
    - Run 100 iterations
  
  - [ ]* 15.11 Write property test for primary image first in gallery (Property 11)
    - **Property 11: Primary Image First in Gallery**
    - **Validates: Requirements 4.8**
    - Generate random carId with images
    - Set random image as primary
    - Query car images
    - Assert first image in results has is_primary=true
    - Run 100 iterations
  
  - [ ]* 15.12 Write property test for reorder atomicity (Property 12)
    - **Property 12: Reorder Atomicity**
    - **Validates: Requirements 5.7**
    - Generate random carId with images
    - Inject database error during reorder transaction
    - Assert either all order_index values updated or none updated
    - Run 100 iterations
  
  - [ ]* 15.13 Write property test for reorder consistency (Property 13)
    - **Property 13: Reorder Consistency**
    - **Validates: Requirements 5.8**
    - Generate random carId with images
    - Generate random new order
    - Call reorderImages
    - Query car images
    - Assert images appear in new order
    - Run 100 iterations
  
  - [ ]* 15.14 Write property test for file type validation (Property 14)
    - **Property 14: File Type Validation**
    - **Validates: Requirements 6.1, 6.8**
    - Generate random file with invalid Content-Type
    - Attempt to generate presigned URL
    - Assert request is rejected with VALIDATION_ERROR
    - Run 100 iterations
  
  - [ ]* 15.15 Write property test for file size validation (Property 15)
    - **Property 15: File Size Validation**
    - **Validates: Requirements 6.2**
    - Generate random file larger than 5MB
    - Attempt to upload
    - Assert request is rejected with VALIDATION_ERROR
    - Run 100 iterations
  
  - [ ]* 15.16 Write property test for public image access (Property 16)
    - **Property 16: Public Image Access**
    - **Validates: Requirements 9.8**
    - Generate random carId and upload image
    - Fetch S3 URL without authentication
    - Assert request succeeds (200 OK)
    - Run 100 iterations
  
  - [ ]* 15.17 Write property test for cascade delete integrity (Property 17)
    - **Property 17: Cascade Delete Integrity**
    - **Validates: Requirements 10.2**
    - Generate random carId with images
    - Delete the car
    - Query car_images table
    - Assert no records exist for deleted carId
    - Run 100 iterations
  
  - [ ]* 15.18 Write property test for foreign key integrity (Property 18)
    - **Property 18: Foreign Key Integrity**
    - **Validates: Requirements 10.8**
    - Generate random imageId
    - Query car_images table
    - Assert car_id references existing car in cars table
    - Run 100 iterations
  
  - [ ]* 15.19 Write property test for concurrent upload safety (Property 19)
    - **Property 19: Concurrent Upload Safety**
    - **Validates: Requirements 11.6, 11.7, 11.8**
    - Generate random carId
    - Initiate multiple concurrent saveImageMetadata calls
    - Wait for all to complete
    - Query car images
    - Assert order_index values are sequential without gaps or duplicates
    - Run 100 iterations
  
  - [ ]* 15.20 Write property test for failed upload isolation (Property 20)
    - **Property 20: Failed Upload Isolation**
    - **Validates: Requirements 11.4**
    - Generate random carId
    - Initiate multiple concurrent uploads
    - Inject failure in one upload
    - Assert other uploads complete successfully
    - Run 100 iterations
  
  - [ ]* 15.21 Write property test for presigned URL performance (Property 21)
    - **Property 21: Presigned URL Performance**
    - **Validates: Requirements 15.1, 15.7**
    - Generate random carId and filename
    - Measure execution time of generatePresignedUrl
    - Assert execution time is under 200 milliseconds
    - Run 100 iterations
  
  - [ ]* 15.22 Write property test for image operation performance (Property 22)
    - **Property 22: Image Operation Performance**
    - **Validates: Requirements 15.8**
    - Generate random carId and image data
    - Measure execution time of saveImageMetadata, deleteImage, setPrimaryImage, reorderImages
    - Assert execution time is under 1 second (excluding S3 upload)
    - Run 100 iterations

- [ ] 16. Implement integration tests
  - [ ]* 16.1 Write E2E test for complete upload flow
    - Admin logs in
    - Navigates to car edit page
    - Selects image files
    - Uploads images
    - Verifies images appear in gallery
    - Use Playwright for browser automation
    - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 14.1, 14.2_
  
  - [ ]* 16.2 Write E2E test for image reordering
    - Admin logs in
    - Opens car with multiple images
    - Drags image to new position
    - Verifies order persists after page reload
    - _Requirements: 5.1, 5.8, 8.6, 8.7_
  
  - [ ]* 16.3 Write E2E test for primary image selection
    - Admin logs in
    - Opens car with multiple images
    - Clicks "Set as Primary" on non-primary image
    - Verifies primary badge moves to selected image
    - Verifies primary image appears first in public gallery
    - _Requirements: 4.1, 4.2, 4.8, 13.2_
  
  - [ ]* 16.4 Write E2E test for image deletion
    - Admin logs in
    - Opens car with multiple images
    - Deletes an image
    - Confirms deletion in dialog
    - Verifies image is removed from gallery
    - Verifies changes persist after page reload
    - _Requirements: 3.1, 3.2, 3.8_
  
  - [ ]* 16.5 Write API integration test for concurrent uploads
    - Create car with no images
    - Initiate 5 concurrent metadata save requests
    - Verify all 5 images are saved
    - Verify order_index values are 0, 1, 2, 3, 4 (sequential)
    - Verify exactly one image is primary
    - _Requirements: 11.2, 11.3, 11.6, 11.7, 11.8_
  
  - [ ]* 16.6 Write API integration test for error recovery
    - Generate presigned URL
    - Wait 6 minutes (URL expires)
    - Attempt upload to expired URL
    - Verify S3 returns 403 AccessDenied
    - Generate new presigned URL
    - Upload successfully with new URL
    - _Requirements: 12.1, 12.2_

- [ ] 17. Final checkpoint - Ensure all tests pass
  - Run all unit tests (backend and frontend)
  - Run all property-based tests
  - Run all integration tests
  - Run all E2E tests
  - Verify no regressions in existing functionality
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- The implementation follows a bottom-up approach: database → backend → frontend → integration
- All image operations are admin-only (Cognito authorizer + admin group check)
- S3 uploads use presigned URLs for direct browser-to-S3 transfer (no Lambda proxy)
- Database transactions ensure consistency for multi-image operations
- TanStack Query manages all server state with optimistic updates for better UX
