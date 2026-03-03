# Implementation Plan: CDK Storage + API Stacks

## Overview

This implementation plan covers Days 7-9 of the Prime Deal Auto project: creating the StorageStack (S3 + CloudFront) and ApiStack (API Gateway + Lambda) CDK stacks, along with the backend Lambda handler with path-based routing and the cars API endpoint.

## Tasks

- [x] 1. Implement StorageStack (S3 + CloudFront with OAC)
  - [x] 1.1 Create StorageStack with S3 bucket configuration
    - Create `infrastructure/lib/stacks/storage-stack.ts`
    - Configure S3 bucket with versioning, BPA, SSE-S3 encryption, CORS, enforceSSL
    - Set removalPolicy to DESTROY and autoDeleteObjects for dev environment
    - Export bucket as public readonly property
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.2 Add CloudFront distribution with Origin Access Control
    - Create S3OriginAccessControl with SIGV4_ALWAYS signing
    - Configure CloudFront distribution with S3BucketOrigin.withOriginAccessControl
    - Set PriceClass_100, TLS_V1_2_2021, REDIRECT_TO_HTTPS
    - Configure CACHING_OPTIMIZED cache policy and CORS response headers
    - Export distribution as public readonly property
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 1.3 Add CloudFormation outputs and cdk-nag suppressions
    - Add CfnOutputs for BucketName, BucketArn, DistributionId, DistributionDomainName
    - Add documented cdk-nag suppressions for S1, CFR1, CFR2, CFR4
    - _Requirements: 9.5, 10.1_

  - [x]* 1.4 Write CDK assertions tests for StorageStack
    - Create `infrastructure/test/storage-stack.test.ts`
    - Test S3 bucket versioning, BPA, SSE-S3 encryption (Property 1)
    - Test CloudFront OAC configuration (Property 2)
    - Test CloudFront PriceClass_100 (Property 3)
    - **Property 1: S3 Bucket Security Configuration**
    - **Property 2: CloudFront OAC Configuration**
    - **Property 3: CloudFront Price Class**
    - **Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.5**

- [x] 2. Implement ApiStack CDK infrastructure
  - [x] 2.1 Create ApiStack with Lambda function
    - Create `infrastructure/lib/stacks/api-stack.ts`
    - Define ApiStackProps interface with cross-stack dependencies
    - Create Lambda security group with egress to RDS Proxy on port 5432
    - Configure NodejsFunction with Node.js 20, ARM64, 1024MB, 30s timeout
    - Set VPC configuration with PRIVATE_ISOLATED subnets
    - Configure environment variables: DB_HOST, DB_NAME, SECRET_ARN, S3_BUCKET, CLOUDFRONT_URL, FRONTEND_URL
    - Configure esbuild bundling with minify, sourceMap, external @aws-sdk/*
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 2.2 Configure API Gateway REST API
    - Create RestApi with Lambda proxy integration
    - Configure deployOptions: stageName v1, caching enabled, 0.5 cache cluster
    - Set throttling: 100 burst, 50 rate limit
    - Configure default CORS preflight options
    - _Requirements: 3.1, 3.4, 3.5_

  - [x] 2.3 Add Cognito authorizer and route definitions
    - Create CognitoUserPoolsAuthorizer with userPool from props
    - Add /health GET route (public)
    - Add /cars GET route (public)
    - Add /cars POST route (protected with Cognito authorizer)
    - Add /cars/{carId} GET route (public)
    - _Requirements: 3.2, 3.3_

  - [x] 2.4 Configure Lambda IAM permissions
    - Grant Secrets Manager read access (scoped to dbSecret)
    - Grant S3 read/write access (scoped to bucket)
    - Add VPC execution role permissions
    - _Requirements: 4.6, 10.5_

  - [x] 2.5 Add CloudFormation outputs and cdk-nag suppressions
    - Add CfnOutputs for ApiUrl, ApiId
    - Add documented cdk-nag suppressions for APIG2, APIG4, COG4, IAM4
    - _Requirements: 9.5, 10.1_

  - [x]* 2.6 Write CDK assertions tests for ApiStack
    - Create `infrastructure/test/api-stack.test.ts`
    - Test Lambda runtime, architecture, memory, timeout (Property 5)
    - Test Lambda environment variables (Property 5)
    - Test API Gateway Lambda integration and Cognito authorizer (Property 4)
    - Test Lambda security group egress rule (Property 14)
    - Test ApiUrl output exists (Property 15)
    - **Property 4: API Gateway Configuration**
    - **Property 5: Lambda Function Configuration**
    - **Property 14: Lambda Security Group Egress**
    - **Property 15: CloudFormation Outputs**
    - **Validates: Requirements 3.1, 3.2, 3.4, 3.5, 4.1, 4.2, 4.3, 4.5, 9.4, 9.5**

- [x] 3. Checkpoint - Verify CDK stacks synthesize
  - Ensure `cdk synth --profile prime-deal-auto` passes without errors
  - Ensure cdk-nag checks pass (or have documented suppressions)
  - Ask the user if questions arise

- [x] 4. Implement backend library modules
  - [x] 4.1 Create database connection module
    - Create `backend/src/lib/database.ts`
    - Implement getSecret() with Secrets Manager client and caching
    - Implement getPool() with pg Pool, max: 1, SSL, keepAlive
    - Initialize pool outside handler for connection reuse
    - Add error handling with structured logging
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 4.2 Create response helper module
    - Create `backend/src/lib/response.ts`
    - Implement success() helper with CORS headers
    - Implement error() helper with error codes
    - Implement paginated() helper with hasMore calculation
    - Define corsHeaders constant with FRONTEND_URL from env
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 4.3 Write property tests for response helpers
    - Create `backend/tests/unit/response.test.ts`
    - Test success response structure with fast-check (Property 8)
    - Test error response structure with fast-check (Property 9)
    - Test paginated response fields with fast-check (Property 10)
    - Test CORS headers presence with fast-check (Property 11)
    - **Property 8: Success Response Format**
    - **Property 9: Error Response Format**
    - **Property 10: Paginated Response Format**
    - **Property 11: Response Headers**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

- [x] 5. Implement cars API layer
  - [x] 5.1 Create Car types and interfaces
    - Create `backend/src/types/index.ts`
    - Define Car interface with all database fields
    - Define CarFilters interface for repository
    - Define ListCarsInput interface for service
    - _Requirements: 8.5_

  - [x] 5.2 Implement CarRepository
    - Create `backend/src/repositories/cars.repository.ts`
    - Implement findAll() with dynamic filter building
    - Implement findById() for single car lookup
    - Use parameterized queries with $1, $2 placeholders
    - Whitelist ORDER BY columns to prevent SQL injection
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 5.3 Implement CarService
    - Create `backend/src/services/cars.service.ts`
    - Implement listCars() with pagination defaults and limits
    - Implement getCarById() delegating to repository
    - Enforce status='active' filter for public queries
    - _Requirements: 8.1, 8.2_

  - [x] 5.4 Implement cars handler
    - Create `backend/src/handlers/cars.handler.ts`
    - Implement handleGetCars() parsing query params
    - Implement handleGetCarById() with path param extraction
    - Return appropriate error responses for validation/not found
    - _Requirements: 5.2, 6.1, 6.2, 6.3_

- [x] 6. Implement Lambda entry point with path-based routing
  - [x] 6.1 Create main Lambda handler
    - Create `backend/src/lambda.ts`
    - Implement OPTIONS preflight handler returning 200 with CORS
    - Implement path-based router matching method + path
    - Route GET /health to health handler
    - Route GET /cars to handleGetCars
    - Route GET /cars/{carId} to handleGetCarById
    - Return 404 NOT_FOUND for unmatched routes
    - Wrap in try/catch returning 500 INTERNAL_ERROR
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 6.2 Create health handler
    - Create `backend/src/handlers/health.handler.ts`
    - Return success response with status: 'ok' and timestamp
    - _Requirements: 5.2_

  - [ ]* 6.3 Write property tests for Lambda routing
    - Create `backend/tests/unit/lambda.test.ts`
    - Test OPTIONS returns 200 with CORS for any path (Property 7)
    - Test unmatched routes return 404 NOT_FOUND (Property 7)
    - Test health endpoint returns success
    - **Property 7: Request Routing Correctness**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

- [x] 7. Checkpoint - Verify backend compiles and tests pass
  - Ensure `cd backend && npm run build` succeeds
  - Ensure `cd backend && npm test` passes
  - Ask the user if questions arise

- [x] 8. Wire cross-stack dependencies in CDK app
  - [x] 8.1 Update infrastructure/bin/app.ts
    - Import StorageStack and ApiStack
    - Instantiate StorageStack (no dependencies)
    - Instantiate ApiStack with props from AuthStack, DatabaseStack, StorageStack
    - Pass userPool, vpc, dbSecurityGroup, rdsProxy, dbSecret, bucket, distribution
    - Ensure correct deployment order via dependencies
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 9. Deploy and verify
  - [x] 9.1 Deploy StorageStack
    - Run `npx cdk deploy PrimeDeals-Storage --profile prime-deal-auto`
    - Verify S3 bucket created with correct configuration
    - Verify CloudFront distribution created with OAC
    - Note CloudFront domain name for testing
    - _Requirements: 10.2_

  - [x] 9.2 Deploy ApiStack
    - Run `npx cdk deploy PrimeDeals-Api --profile prime-deal-auto`
    - Verify Lambda function created in VPC
    - Verify API Gateway created with routes
    - Note API URL from stack outputs
    - Fixed Lambda → RDS Proxy security group connectivity using CfnSecurityGroupIngress
    - Resolved CloudFormation export migration issue with legacy output
    - _Requirements: 10.2_

  - [x] 9.3 Test API endpoints
    - Test GET /health returns 200 with success response ✓
    - Test GET /cars returns 200 with paginated response (empty data initially) ✓
    - Test GET /cars/{invalid-id} returns 404 NOT_FOUND ✓
    - Verify CORS headers present in responses ✓
    - _Requirements: 5.2, 6.1, 6.2, 6.3, 6.4_

- [x] 10. Final checkpoint - Ensure all tests pass
  - Run `cd infrastructure && npm test` - all CDK tests pass
  - Run `cd backend && npm test` - all handler tests pass
  - Verify deployed API responds correctly
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- StorageStack can be deployed in parallel with AuthStack/DatabaseStack (no dependencies)
- ApiStack depends on all three stacks (Auth, Database, Storage)
- All CDK commands must use `--profile prime-deal-auto`
- Lambda uses RDS Proxy endpoint from DatabaseStack (already deployed)
- Property tests use fast-check library for property-based testing
