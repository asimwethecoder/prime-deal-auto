# Prime Deal Auto — Environment & Deployment Guide

## Prerequisites

### AWS Account Setup
- AWS Account with admin access
- AWS CLI v2 installed and configured (`aws configure`)
- Region: `us-east-1` (required for Bedrock)
- CDK bootstrapped: `npx cdk bootstrap aws://ACCOUNT_ID/us-east-1`

### Local Development Tools
- Node.js 20 LTS
- npm 10+
- Git
- TypeScript 5.7+
- AWS CDK CLI: `npm install -g aws-cdk`

### AWS Services to Enable
- Amazon Bedrock: Request model access for Claude Sonnet 4 in us-east-1
- Amazon SES: Verify sender email domain or address
- Amazon OpenSearch Serverless: No pre-setup needed (CDK creates it)

## Environment Variables

### Frontend (.env.local)

```bash
# API
NEXT_PUBLIC_API_URL=               # From ApiStack output (API Gateway URL)

# Cognito
NEXT_PUBLIC_COGNITO_USER_POOL_ID=  # From AuthStack output
NEXT_PUBLIC_COGNITO_CLIENT_ID=     # From AuthStack output

# CloudFront
NEXT_PUBLIC_CLOUDFRONT_URL=        # From StorageStack output

# Site
NEXT_PUBLIC_SITE_URL=https://primedealauto.com
NEXT_PUBLIC_SITE_NAME=Prime Deal Auto
```

### Backend Lambda (set via CDK environment)

```bash
# Database (Aurora)
DB_HOST=                           # RDS Proxy endpoint (single writer, reads + writes)
DB_NAME=primedealauto
DB_PORT=5432
DB_SECRET_ARN=                     # Secrets Manager ARN

# Storage
S3_BUCKET=                         # From StorageStack
CLOUDFRONT_URL=                    # From StorageStack

# Search
OPENSEARCH_ENDPOINT=               # From SearchStack
OPENSEARCH_INDEX=cars

# AI
BEDROCK_MODEL_ID=anthropic.claude-sonnet-4-20250514-v1:0
BEDROCK_REGION=us-east-1

# Email
SES_FROM_EMAIL=noreply@primedealauto.com
SES_REGION=us-east-1

# Monitoring
LOG_LEVEL=info
```

## Deployment Strategy: Deploy First, CI/CD Later

### Step 1: Infrastructure (CDK)

```bash
cd infrastructure
npm install

# Deploy stacks in order
npx cdk deploy PrimeDeals-Auth --require-approval never
npx cdk deploy PrimeDeals-Database --require-approval never
npx cdk deploy PrimeDeals-Storage --require-approval never
npx cdk deploy PrimeDeals-Api --require-approval never
```

After each deploy, note the stack outputs (UserPoolId, ClusterEndpoint, ApiUrl, etc.).

### Step 2: Database Migration

```bash
# Connect to Aurora via bastion host or RDS Proxy
# Run schema.sql to create tables, indexes, triggers
psql -h <rds-proxy-endpoint> -U postgres -d primedealauto -f backend/db/schema.sql
```

### Step 3: Frontend First Deploy

```bash
cd frontend
npm install
npm run build

# Option A: Amplify Console (recommended)
# 1. Go to AWS Amplify Console
# 2. Create new app → Connect GitHub repo
# 3. Select branch: main
# 4. Framework: Next.js SSR
# 5. Add environment variables from .env.local
# 6. Deploy

# Option B: Manual push
# amplify init → amplify push
```

### Step 4: Verify

- Visit the Amplify URL
- Confirm home page loads
- Confirm car listing fetches from API Gateway → Lambda → Aurora
- Test creating a car via curl or Postman

### Step 5: CI/CD Setup (After First Deploy Works)

```yaml
# amplify.yml (in repo root)
version: 1
applications:
  - frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
          - .next/cache/**/*
    appRoot: frontend
```

## Amplify Hosting Configuration

### Build Settings for Next.js 15 SSR

```yaml
version: 1
applications:
  - frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - env | grep -e NEXT_PUBLIC_ >> .env.production
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
          - .next/cache/**/*
    appRoot: frontend
```

### Branch Deployments

| Branch | Environment | Auto-deploy |
|--------|------------|-------------|
| `main` | Production | Yes |
| `dev` | Staging | Yes |
| Feature branches | Preview | Manual |

## Database Connection from Lambda

Lambda functions connect to Aurora via RDS Proxy (in the same VPC).
- Connection pooling handled by RDS Proxy
- Credentials from Secrets Manager (auto-rotation)
- SSL required for all connections
- Max 1 connection per Lambda instance

## Cost Estimates (Monthly, Low Traffic)

| Service | Estimated Cost | Notes |
|---------|---------------|-------|
| Aurora Serverless v2 | $15-30 | 0.5 ACU minimum, single AZ, single writer |
| API Gateway | $3-10 | First 1M requests free, caching ~$15/mo if enabled |
| Lambda | $0-5 | First 1M requests free |
| S3 | $1-3 | Storage + requests |
| CloudFront | $1-5 | First 1TB free |
| Cognito | $0 | First 50K MAU free |
| OpenSearch Serverless | $25-50 | Minimum 2 OCU (most expensive) |
| Amplify Hosting | $0-5 | Build minutes + hosting |
| Bedrock | $5-20 | Per-token pricing, depends on chat usage |
| SES | $0-1 | First 62K emails free |
| VPC Endpoints | $7-15 | ~$7/mo per interface endpoint |
| **Total** | **~$55-145/mo** | Low traffic estimate, no NAT Gateway |

Note: OpenSearch Serverless has a minimum cost. Consider deferring it to Phase 2 and using PostgreSQL full-text search initially.
