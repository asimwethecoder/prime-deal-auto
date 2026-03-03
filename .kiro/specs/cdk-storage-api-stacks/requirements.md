# Requirements: CDK Storage + API Stacks

## Requirement 1: StorageStack - S3 Bucket Configuration

**User Story:** As a developer, I want an S3 bucket configured for car image storage, so that images can be securely stored and served efficiently.

### Acceptance Criteria

1. WHEN the StorageStack is deployed THEN the system SHALL create an S3 bucket with versioning enabled
2. WHEN the S3 bucket is created THEN the system SHALL block all public access to the bucket
3. WHEN the S3 bucket is created THEN the system SHALL enable server-side encryption with S3-managed keys (SSE-S3)
4. WHEN the S3 bucket is created THEN the system SHALL configure CORS to allow uploads from the frontend origin
5. WHEN objects are uploaded THEN the system SHALL store them with the configured encryption

---

## Requirement 2: StorageStack - CloudFront Distribution

**User Story:** As a user, I want car images served through a CDN, so that images load quickly regardless of my location.

### Acceptance Criteria

1. WHEN the StorageStack is deployed THEN the system SHALL create a CloudFront distribution with the S3 bucket as origin
2. WHEN CloudFront accesses S3 THEN the system SHALL use Origin Access Control (OAC) instead of Origin Access Identity (OAI)
3. WHEN the S3 bucket policy is configured THEN the system SHALL only allow access from the CloudFront distribution via OAC
4. WHEN images are requested THEN the system SHALL serve them with appropriate cache headers (max-age 31536000 for immutable assets)
5. WHEN the distribution is created THEN the system SHALL use PriceClass_100 (US, Canada, Europe) for cost optimization

---

## Requirement 3: ApiStack - API Gateway Configuration

**User Story:** As a developer, I want a REST API Gateway configured with proper authentication, so that endpoints are secured appropriately.

### Acceptance Criteria

1. WHEN the ApiStack is deployed THEN the system SHALL create a REST API Gateway with Lambda proxy integration
2. WHEN the API Gateway is created THEN the system SHALL configure a Cognito User Pool authorizer for protected endpoints
3. WHEN requests are made to protected endpoints THEN the system SHALL validate the JWT token against the Cognito User Pool
4. WHEN the API Gateway is created THEN the system SHALL enable stage-level caching with configurable TTLs
5. WHEN the API Gateway is created THEN the system SHALL configure throttling at 100 requests/second per IP
6. WHEN CORS preflight requests are received THEN the system SHALL respond with appropriate CORS headers

---

## Requirement 4: ApiStack - Lambda Function Configuration

**User Story:** As a developer, I want a Lambda function configured for optimal performance and database connectivity, so that API requests are handled efficiently.

### Acceptance Criteria

1. WHEN the Lambda function is created THEN the system SHALL use Node.js 20 runtime with ARM64 architecture
2. WHEN the Lambda function is created THEN the system SHALL configure 1024 MB memory and 30 second timeout
3. WHEN the Lambda function is created THEN the system SHALL attach it to the VPC for RDS Proxy access
4. WHEN the Lambda function is created THEN the system SHALL bundle it with esbuild via NodejsFunction construct
5. WHEN the Lambda function is created THEN the system SHALL set environment variables for DB_HOST, DB_NAME, SECRET_ARN, S3_BUCKET, and CLOUDFRONT_URL
6. WHEN the Lambda function accesses resources THEN the system SHALL grant least-privilege IAM permissions for Secrets Manager, S3, and VPC networking

---

## Requirement 5: Lambda Handler - Path-Based Routing

**User Story:** As a developer, I want a single Lambda handler with path-based routing, so that all API endpoints are handled by one function with clear separation of concerns.

### Acceptance Criteria

1. WHEN a request is received THEN the system SHALL route it based on HTTP method and path
2. WHEN a CORS preflight (OPTIONS) request is received THEN the system SHALL return 200 with CORS headers
3. WHEN a request matches a defined route THEN the system SHALL delegate to the appropriate handler function
4. WHEN a request does not match any route THEN the system SHALL return 404 with NOT_FOUND error code
5. WHEN an unhandled error occurs THEN the system SHALL return 500 with INTERNAL_ERROR code and log the error

---

## Requirement 6: Lambda Handler - Response Format

**User Story:** As a frontend developer, I want consistent API response formats, so that I can reliably parse and handle responses.

### Acceptance Criteria

1. WHEN a request succeeds THEN the system SHALL return `{ success: true, data: {...} }`
2. WHEN a request fails THEN the system SHALL return `{ success: false, error: "message", code: "ERROR_CODE" }`
3. WHEN returning paginated data THEN the system SHALL include `{ data: [...], total, page, limit, hasMore }`
4. WHEN returning any response THEN the system SHALL include CORS headers
5. WHEN returning any response THEN the system SHALL set Content-Type to application/json

---

## Requirement 7: Database Connection - Pool Configuration

**User Story:** As a developer, I want database connections properly pooled and managed, so that Lambda functions efficiently connect to Aurora via RDS Proxy.

### Acceptance Criteria

1. WHEN the Lambda cold starts THEN the system SHALL initialize the pg Pool outside the handler for connection reuse
2. WHEN configuring the Pool THEN the system SHALL set max connections to 1 (RDS Proxy handles server-side pooling)
3. WHEN configuring the Pool THEN the system SHALL enable SSL with rejectUnauthorized: true
4. WHEN configuring the Pool THEN the system SHALL enable keepAlive to prevent idle connection drops
5. WHEN the Lambda needs credentials THEN the system SHALL fetch them from Secrets Manager and cache in module scope

---

## Requirement 8: Cars Domain - Handler/Service/Repository Layering

**User Story:** As a developer, I want clear separation between handlers, services, and repositories, so that the codebase is maintainable and testable.

### Acceptance Criteria

1. WHEN implementing the cars domain THEN the system SHALL have handlers that parse requests and format responses
2. WHEN implementing the cars domain THEN the system SHALL have services that contain business logic and validation
3. WHEN implementing the cars domain THEN the system SHALL have repositories that execute database queries
4. WHEN handlers call services THEN the system SHALL pass typed DTOs, not raw request objects
5. WHEN repositories return data THEN the system SHALL return typed domain objects matching the Car interface

---

## Requirement 9: Cross-Stack References

**User Story:** As a developer, I want proper cross-stack references, so that resources from AuthStack and DatabaseStack are accessible in ApiStack.

### Acceptance Criteria

1. WHEN ApiStack is instantiated THEN the system SHALL receive userPool and userPoolClient from AuthStack via props
2. WHEN ApiStack is instantiated THEN the system SHALL receive vpc, dbSecurityGroup, proxy, and secret from DatabaseStack via props
3. WHEN ApiStack is instantiated THEN the system SHALL receive bucket and distribution from StorageStack via props
4. WHEN the Lambda security group is created THEN the system SHALL allow outbound to the database security group on port 5432
5. WHEN CloudFormation outputs are created THEN the system SHALL export ApiUrl for use by frontend and other consumers

---

## Requirement 10: CDK Best Practices

**User Story:** As a developer, I want the stacks to follow CDK best practices, so that deployments are safe and compliant.

### Acceptance Criteria

1. WHEN stacks are deployed THEN the system SHALL pass cdk-nag AwsSolutionsChecks with documented suppressions only
2. WHEN construct IDs are chosen THEN the system SHALL use stable, descriptive names that won't change
3. WHEN resources are created THEN the system SHALL let CDK auto-generate names (no hardcoded resource names)
4. WHEN stacks are created THEN the system SHALL inherit global tags (Project: PrimeDealAuto, Environment: dev)
5. WHEN IAM permissions are granted THEN the system SHALL use CDK grant methods for least-privilege access
