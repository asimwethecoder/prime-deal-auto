import { Client } from '@opensearch-project/opensearch';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

/**
 * OpenSearch client singleton instance
 * Initialized outside handler for connection reuse across warm Lambda invocations
 */
let client: Client | null = null;

/**
 * Get or create OpenSearch client with AWS Signature V4 authentication
 * 
 * Configuration:
 * - Service: 'aoss' (OpenSearch Serverless)
 * - Region: from AWS_REGION environment variable (defaults to us-east-1)
 * - Credentials: Lambda execution role credentials from environment
 * - Request timeout: 5000ms
 * - Max retries: 3 with exponential backoff
 * - Retry on timeout: enabled
 * 
 * @returns OpenSearch client instance
 * @throws Error if OPENSEARCH_ENDPOINT environment variable is not set
 */
export function getOpenSearchClient(): Client {
  if (!client) {
    const endpoint = process.env.OPENSEARCH_ENDPOINT;
    if (!endpoint) {
      throw new Error('OPENSEARCH_ENDPOINT environment variable not set');
    }

    console.log('Initializing OpenSearch client', {
      endpoint,
      region: process.env.AWS_REGION || 'us-east-1'
    });

    client = new Client({
      ...AwsSigv4Signer({
        region: process.env.AWS_REGION || 'us-east-1',
        service: 'aoss', // OpenSearch Serverless
        // Use default credential provider chain (Lambda execution role)
        getCredentials: () => {
          return defaultProvider()();
        }
      }),
      node: endpoint,
      requestTimeout: 5000, // 5 second timeout
      maxRetries: 3, // Retry up to 3 times
      retryOnTimeout: true // Retry on timeout errors
    });
  }

  return client;
}

/**
 * Structured error class for OpenSearch operations
 * 
 * Provides consistent error handling with:
 * - Human-readable error message
 * - HTTP status code (if available)
 * - Original error for debugging
 * 
 * Used to wrap OpenSearch client errors and provide structured error handling
 * in the service layer for fallback orchestration.
 */
export class OpenSearchError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'OpenSearchError';

    // Log the error for debugging (CloudWatch)
    console.error('OpenSearchError:', {
      message,
      statusCode,
      originalError: originalError instanceof Error ? {
        name: originalError.name,
        message: originalError.message,
        stack: originalError.stack
      } : originalError
    });
  }
}
