# Prime Deal Auto — CDK Infrastructure Stacks Guide

## Stack Overview & Deployment Order

Stacks must be deployed in dependency order. Each stack exports values consumed by downstream stacks.

```
1. AuthStack          → Cognito User Pool, Groups
2. DatabaseStack      → Aurora PostgreSQL Serverless v2, Secrets Manager
3. StorageStack       → S3 Bucket, CloudFront Distribution
4. ApiStack           → API Gateway (REST) + Lambda Handler (depends on 1, 2, 3)
5. SearchStack        → OpenSearch Serverless Collection (depends on 4)
6. MonitoringStack    → CloudWatch Dashboards, Alarms (depends on all)
7. HostingStack       → Amplify App (depends on 4)
```

## Stack Details

### 1. AuthStack
Creates Cognito User Pool with email sign-up, password policies, and user groups.

Resources:
- Cognito User Pool (email as username, auto-verify email)
- Cognito User Pool Client (SRP auth flow for frontend)
- User Groups: `admin`, `dealer`, `user`
- Post-confirmation Lambda trigger (sync user to Aurora)

Exports: `UserPoolId`, `UserPoolClientId`, `UserPoolArn`

### 2. DatabaseStack
Aurora PostgreSQL Serverless v2 with auto-scaling, multi-AZ, and Secrets Manager.

Resources:
- VPC (2 AZs, private subnets for DB, public for NAT)
- Aurora Serverless v2 Cluster (PostgreSQL 15)
  - Min capacity: 0.5 ACU, Max: 4 ACU
  - Writer instance + optional reader
- Secrets Manager secret (auto-rotation 30 days)
- Security Group (allow Lambda access on port 5432)
- RDS Proxy (connection pooling for Lambda)

Exports: `ClusterEndpoint`, `ReaderEndpoint`, `SecretArn`, `SecurityGroupId`, `VpcId`, `PrivateSubnetIds`

### 3. StorageStack
S3 bucket for car images with CloudFront CDN distribution.

Resources:
- S3 Bucket (block all public access, versioning, SSE-S3 encryption)
- CloudFront Distribution (OAC, HTTPS only, Brotli+Gzip compression)
- CloudFront Origin Access Control
- S3 Bucket Policy (CloudFront-only access)
- CloudFront cache policy: images 1 year TTL, content-hash naming

Exports: `BucketName`, `BucketArn`, `DistributionId`, `DistributionDomainName`

### 4. ApiStack (largest stack)
API Gateway REST API with Lambda handler.

Resources:
- API Gateway REST API
  - Regional endpoint
  - Cognito User Pool Authorizer (for protected routes)
  - Stage-level caching (0.5 GB, per-method TTL overrides)
  - CORS configuration
- Lambda Function (single handler with path-based routing)
  - Runtime: Node.js 20, ARM64
  - VPC-attached (for Aurora access)
  - Environment: DB endpoints, S3 bucket, secrets ARN
  - Bundled with esbuild
  - Memory: 1024 MB, Timeout: 30s
- IAM Role (least privilege: Aurora, S3, Bedrock, OpenSearch, SES, Secrets Manager)
- API Gateway → Lambda proxy integration
- Custom domain (optional, via Route 53)

Exports: `ApiUrl`, `ApiId`

### 5. SearchStack
OpenSearch Serverless for full-text search.

Resources:
- OpenSearch Serverless Collection (type: SEARCH)
- Access Policy (Lambda role access)
- Network Policy (VPC endpoint or public)
- Encryption Policy (AWS-owned key)
- Data lifecycle policy

Exports: `CollectionEndpoint`, `CollectionArn`

### 6. MonitoringStack
CloudWatch dashboards and alarms.

Resources:
- CloudWatch Dashboard (API latency, error rates, DB connections)
- Alarms: Lambda errors > 5/min, Aurora CPU > 80%, 5xx rate > 1%
- SNS Topic for alarm notifications
- Log groups with 30-day retention

### 7. HostingStack
Amplify hosting for Next.js SSR.

Resources:
- Amplify App (connected to GitHub repo)
- Branch: main → production
- Build settings for Next.js SSR
- Environment variables (API URL, Cognito IDs, CloudFront URL)
- Custom domain (optional)

## CDK App Entry Point

```typescript
// infrastructure/bin/app.ts
const app = new cdk.App();
const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' };

const auth = new AuthStack(app, 'PrimeDeals-Auth', { env });
const db = new DatabaseStack(app, 'PrimeDeals-Database', { env });
const storage = new StorageStack(app, 'PrimeDeals-Storage', { env });
const api = new ApiStack(app, 'PrimeDeals-Api', {
  env,
  userPool: auth.userPool,
  cluster: db.cluster,
  secret: db.secret,
  vpc: db.vpc,
  bucket: storage.bucket,
  distribution: storage.distribution,
});
const search = new SearchStack(app, 'PrimeDeals-Search', { env });
new MonitoringStack(app, 'PrimeDeals-Monitoring', { env, api: api.restApi });
new HostingStack(app, 'PrimeDeals-Hosting', { env, apiUrl: api.apiUrl });
```

## Deployment Commands

```bash
# First time setup
cd infrastructure
npm install
npx cdk bootstrap

# Deploy all stacks in order
npx cdk deploy PrimeDeals-Auth
npx cdk deploy PrimeDeals-Database
npx cdk deploy PrimeDeals-Storage
npx cdk deploy PrimeDeals-Api
npx cdk deploy PrimeDeals-Search
npx cdk deploy PrimeDeals-Monitoring
npx cdk deploy PrimeDeals-Hosting

# Or deploy all at once (CDK resolves order)
npx cdk deploy --all

# Destroy (reverse order)
npx cdk destroy --all
```
