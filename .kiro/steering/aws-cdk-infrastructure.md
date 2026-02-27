---
inclusion: always
---

# AWS CDK Infrastructure Conventions

## CDK v2 TypeScript Patterns
- All stacks in `infrastructure/lib/stacks/`
- Reusable constructs in `infrastructure/lib/constructs/`
- Environment config in `infrastructure/lib/config/`
- Entry point: `infrastructure/bin/app.ts`
- Import from `aws-cdk-lib` (single package) — no individual `@aws-cdk/*` packages
- Use strict TypeScript — avoid `any` types, describe all data shapes with interfaces

## Security: cdk-nag
- Install and enable `cdk-nag` in the CDK app entry point for automated security checks
- Use `AwsSolutionsChecks` rule pack (based on AWS Well-Architected Framework)
- Add suppressions only with documented justification — never blanket-suppress
- Run `cdk synth` locally to catch cdk-nag violations before deploying
```typescript
import { AwsSolutionsChecks } from 'cdk-nag';
Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));
```

## Stack Naming
All stacks use the prefix `PrimeDeals-`:
- `PrimeDeals-Auth`
- `PrimeDeals-Database`
- `PrimeDeals-Storage`
- `PrimeDeals-Api`
- `PrimeDeals-Search`
- `PrimeDeals-Monitoring`
- `PrimeDeals-Hosting`

## Deployment Order (dependency chain)
```
1. AuthStack          → Cognito User Pool, Groups
2. DatabaseStack      → VPC, Aurora Serverless v2, Secrets Manager, RDS Proxy
3. StorageStack       → S3 Bucket, CloudFront Distribution
4. ApiStack           → API Gateway + Lambda (depends on 1, 2, 3)
5. SearchStack        → OpenSearch Serverless (depends on 4)
6. MonitoringStack    → CloudWatch Dashboards, Alarms (depends on all)
7. HostingStack       → Amplify App (depends on 4)
```

## Cross-Stack References
- Pass resources via stack props (not SSM Parameter Store)
- Example: `ApiStack` receives `userPool`, `cluster`, `secret`, `vpc`, `bucket`, `distribution` as props
- Export CfnOutputs for values needed outside CDK (API URL, User Pool ID, etc.)

## Logical ID Stability (Critical)
- Never change construct IDs of stateful resources (databases, S3 buckets, Cognito pools)
- Changing a construct ID causes CloudFormation to replace the resource (data loss for DBs)
- Use `cdk diff` before every deploy to verify no unintended replacements
- For refactoring, use `overrideLogicalId()` to preserve the original logical ID

## Resource Naming
- Never hardcode AWS resource names (bucket names, table names, etc.)
- Let CDK auto-generate names or use environment-based prefixes
- Hardcoded names prevent multi-environment deployment (dev/staging/prod in same account)

## AWS Account & Profile (Critical — Never Deploy Elsewhere)
- AWS Account ID: `141814481613`
- AWS CLI Profile: `prime-deal-auto`
- Region: `us-east-1` (required for Bedrock)
- ALWAYS use `--profile prime-deal-auto` for all AWS CLI and CDK commands
- CDK app must hardcode the account/region in `bin/app.ts` to prevent accidental cross-account deploys
- Environment-specific config in `infrastructure/lib/config/environments.ts`

```typescript
// infrastructure/bin/app.ts — hardcoded account safety
const env = { account: '141814481613', region: 'us-east-1' };
```

All CDK commands:
```bash
npx cdk deploy --all --profile prime-deal-auto
npx cdk diff --profile prime-deal-auto
npx cdk synth --profile prime-deal-auto
npx cdk destroy --all --profile prime-deal-auto
```

## Lambda Configuration
- Runtime: Node.js 20, ARM64 (Graviton2 — better price/performance)
- Memory: 1024 MB
- Timeout: 30 seconds
- VPC-attached (for Aurora access via RDS Proxy)
- Bundled with esbuild (CDK `NodejsFunction`)
- Environment variables set from stack outputs (DB endpoints, S3 bucket, secrets ARN)

## IAM
- Least privilege always — scope to specific resources, never wildcard `*` actions
- Use CDK grant methods where available (`bucket.grantReadWrite(lambda)`)
- Lambda role gets: Aurora (via RDS Proxy), S3 (read/write), Bedrock (invoke), OpenSearch (read/write), SES (send), Secrets Manager (read)

## Testing
- CDK assertions for stack unit tests (`Template.fromStack()`)
- Assert resource counts, properties, and IAM policies
- `cdk synth` must pass before deploy
- `cdk diff` to review changes before applying
- cdk-nag checks run automatically during synth

## Tagging
- Tag all resources with: `Project: PrimeDealAuto`, `Environment: dev|staging|prod`
- Use `Tags.of(app).add()` at the app level for global tags

## File References
- CDK stacks guide: #[[file:03-CDK-INFRASTRUCTURE.md]]
- Deployment guide: #[[file:06-ENVIRONMENT-DEPLOYMENT.md]]
