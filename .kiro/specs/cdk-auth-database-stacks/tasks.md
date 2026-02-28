# Implementation Plan: CDK Auth & Database Stacks

## Overview

Implement the AuthStack (`PrimeDeals-Auth`) and DatabaseStack (`PrimeDeals-Database`) as CDK v2 TypeScript stacks. The AuthStack provisions Cognito User Pool, User Pool Client, user groups, and a post-confirmation Lambda stub. The DatabaseStack provisions a VPC (single AZ, no NAT), Aurora PostgreSQL Serverless v2, Secrets Manager, security groups, VPC endpoints, and RDS Proxy. Both stacks pass cdk-nag AwsSolutionsChecks and export resources for downstream consumption.

## Tasks

- [x] 1. Set up testing dependencies and post-confirmation Lambda stub
  - [x] 1.1 Add vitest and fast-check to infrastructure devDependencies, create vitest config
    - Add `vitest`, `fast-check` to `infrastructure/package.json` devDependencies
    - Create `infrastructure/vitest.config.ts` with TypeScript support
    - Create `infrastructure/test/` directory
    - _Requirements: 14.1–14.9_

  - [x] 1.2 Create post-confirmation Lambda handler stub
    - Create `infrastructure/lib/lambda/post-confirmation/index.ts`
    - Implement stub handler that logs the event and returns it unchanged
    - Handler signature: `export async function handler(event: any): Promise<any>`
    - _Requirements: 4.3_

- [x] 2. Implement AuthStack
  - [x] 2.1 Create AuthStack with Cognito User Pool, Client, Groups, and Lambda trigger
    - Create `infrastructure/lib/stacks/auth-stack.ts`
    - Cognito User Pool: email sign-in alias, auto-verify email, password policy (min 8, uppercase, lowercase, digit, symbol), self-sign-up enabled, account recovery via email, `RemovalPolicy.DESTROY`
    - User Pool Client: SRP auth flow (`userSrp: true`), no client secret, COGNITO identity provider
    - Three user groups: `admin`, `dealer`, `user`
    - Post-confirmation Lambda trigger: Node.js 20, ARM64, bundled from `lib/lambda/post-confirmation/`
    - Attach Lambda as `PostConfirmation` trigger on User Pool
    - Public readonly properties: `userPool`, `userPoolClient`
    - CfnOutputs: `UserPoolId`, `UserPoolClientId`, `UserPoolArn`
    - Add cdk-nag suppressions with justifications: COG2 (MFA deferred to production), IAM4 (managed policy for basic execution), L1 (runtime version)
    - _Requirements: 1.1–1.5, 2.1–2.3, 3.1–3.3, 4.1–4.4, 5.1–5.5, 13.1, 13.3_

  - [x]* 2.2 Write unit tests for AuthStack
    - Create `infrastructure/test/auth-stack.test.ts`
    - Verify template contains 1 Cognito User Pool with email alias, auto-verify, password policy, self-sign-up, account recovery
    - Verify template contains 1 User Pool Client with SRP auth, no secret
    - Verify template contains 3 User Pool Groups (admin, dealer, user)
    - Verify template contains 1 Lambda function with Node.js 20 runtime, ARM64
    - Verify User Pool has PostConfirmation trigger configured
    - Verify CfnOutputs: UserPoolId, UserPoolClientId, UserPoolArn
    - _Requirements: 14.1–14.4, 5.3–5.5_

- [x] 3. Implement DatabaseStack
  - [x] 3.1 Create DatabaseStack with VPC, Aurora, Secrets Manager, Security Groups, RDS Proxy, and VPC Endpoints
    - Create `infrastructure/lib/stacks/database-stack.ts`
    - VPC: `maxAzs: 1`, `natGateways: 0`, `PRIVATE_ISOLATED` subnets only
    - Aurora security group: allow inbound TCP 5432 from RDS Proxy SG only
    - Aurora Serverless v2 cluster: PostgreSQL 15, `Credentials.fromGeneratedSecret('postgres')`, `defaultDatabaseName: 'primedealauto'`, serverlessV2 scaling 0.5–4 ACU, storage encryption, deletion protection off, `RemovalPolicy.DESTROY`, single writer instance in isolated subnets
    - RDS Proxy security group: allow inbound TCP 5432 (for future Lambda SG)
    - RDS Proxy: targets Aurora cluster, uses Secrets Manager secret, isolated subnets, `requireTLS: true`, `iamAuth: false`
    - VPC Endpoints: Secrets Manager interface endpoint in isolated subnets
    - Public readonly properties: `vpc`, `cluster`, `secret`, `proxy`, `dbSecurityGroup`
    - CfnOutputs: `ClusterEndpoint`, `SecretArn`, `VpcId`, `RdsProxyEndpoint`
    - Add cdk-nag suppressions with justifications: VPC7 (flow logs deferred), RDS6 (IAM auth not needed with Secrets Manager via Proxy), RDS10 (dev environment), RDS14 (backtrack not supported on PostgreSQL), SMG4 (rotation deferred)
    - _Requirements: 6.1–6.3, 7.1–7.7, 8.1–8.2, 9.1–9.3, 10.1–10.6, 11.1–11.9, 13.2, 13.4_

  - [x]* 3.2 Write unit tests for DatabaseStack
    - Create `infrastructure/test/database-stack.test.ts`
    - Verify template contains VPC resource
    - Verify template contains Aurora DB cluster with PostgreSQL engine, Serverless v2 scaling config (0.5–4 ACU), database name `primedealauto`, storage encryption, deletion protection off
    - Verify template contains DB writer instance
    - Verify template contains Secrets Manager secret
    - Verify template contains security groups with port 5432 ingress rules
    - Verify template contains RDS Proxy with TLS required, IAM auth disabled
    - Verify template contains VPC endpoint for Secrets Manager
    - Verify CfnOutputs: ClusterEndpoint, SecretArn, VpcId, RdsProxyEndpoint
    - _Requirements: 14.5–14.9, 11.6–11.9_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Wire stacks into CDK app and add post-confirmation handler tests
  - [x] 5.1 Update CDK app entry point to instantiate both stacks
    - Update `infrastructure/bin/app.ts`
    - Import and instantiate `AuthStack` with stack name `PrimeDeals-Auth` and hardcoded env
    - Import and instantiate `DatabaseStack` with stack name `PrimeDeals-Database` and hardcoded env
    - Remove placeholder comments for Spec 2 stacks
    - _Requirements: 12.1–12.4_

  - [x]* 5.2 Write unit tests for post-confirmation Lambda handler
    - Create `infrastructure/test/post-confirmation.test.ts`
    - Verify handler returns the input event unchanged (identity function)
    - Verify handler logs the event
    - _Requirements: 4.3_

  - [x]* 5.3 Write property test for post-confirmation trigger round trip (Property 3)
    - **Property 3: Post-confirmation trigger round trip**
    - Use fast-check to generate arbitrary event objects
    - Assert handler returns the exact same event object for all generated inputs
    - Minimum 100 iterations
    - **Validates: Requirements 4.3**

- [x] 6. Final checkpoint - Ensure all tests pass and cdk synth succeeds
  - Ensure all tests pass, ask the user if questions arise.
  - Verify `npx cdk synth --profile prime-deal-auto` produces valid CloudFormation templates without cdk-nag errors (or with documented suppressions).

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property-based testing is limited to Property 3 (trigger round trip) since CDK stacks produce deterministic templates — Properties 1 and 2 are verified via CDK assertion tests
- Requirements 15 (schema migration) and 16 (deployment verification) are manual post-deploy steps, not coding tasks
- All CDK commands must use `--profile prime-deal-auto`
