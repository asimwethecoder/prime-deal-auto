import { S3Client, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client outside handler for connection reuse across warm invocations
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

/**
 * Generate a presigned URL for uploading a file to S3
 * @param bucket - S3 bucket name
 * @param key - S3 object key (path)
 * @param contentType - MIME type of the file (enforced by presigned URL)
 * @returns Presigned URL valid for 5 minutes
 */
export async function generatePresignedUrl(
  bucket: string,
  key: string,
  contentType: string
): Promise<string> {
  const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN;
  
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    // Only set ACL if CloudFront is not enabled (direct S3 access)
    // When CloudFront OAC is used, bucket has BlockPublicAccess enabled
    ...(cloudfrontDomain ? {} : { ACL: 'public-read' }),
  });

  // Generate presigned URL with 5-minute expiration
  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 300, // 5 minutes in seconds
  });

  return presignedUrl;
}

/**
 * Delete an object from S3
 * Idempotent - returns success even if object doesn't exist
 * @param bucket - S3 bucket name
 * @param key - S3 object key (path)
 */
export async function deleteObject(bucket: string, key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    // S3 DeleteObject is idempotent - it succeeds even if the object doesn't exist
    // Log the error but don't throw to maintain idempotency
    console.error('S3 delete error (non-fatal):', error);
  }
}

/**
 * Get the public URL for an S3 object
 * Uses CloudFront URL if CLOUDFRONT_DOMAIN is set, otherwise falls back to direct S3 URL
 * @param bucket - S3 bucket name
 * @param key - S3 object key (path)
 * @returns Public HTTPS URL to the object
 */
export function getPublicUrl(bucket: string, key: string): string {
  const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN;
  
  if (cloudfrontDomain) {
    // Use CloudFront URL for better performance and caching
    return `https://${cloudfrontDomain}/${key}`;
  }
  
  // Fallback to direct S3 URL
  const region = process.env.AWS_REGION || 'us-east-1';
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}
