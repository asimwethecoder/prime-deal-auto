# Requirements Document

## Introduction

This spec covers the creation and deployment of the AuthStack and DatabaseStack for Prime Deal Auto. These are the first two CDK stacks in the deployment chain, providing Cognito-based authentication and Aurora PostgreSQL Serverless v2 database infrastructure. The AuthStack manages user identity (sign-up, sign-in, groups), while the DatabaseStack provisions the VPC, Aurora cluster, RDS Proxy, and Secrets Manager resources that all downstream stacks depend on.

## Glossary

- **AuthStack**: The CDK stack (`PrimeDeals-Auth`) that provisions Cognito User Pool, User Pool Client, user groups, and the post-confirmation Lambda trigger.
- **DatabaseStack**: The CDK stack (`PrimeDeals-Database`) that provisions the VPC, Aurora Serverless v2 cluster, Secrets Manager secret, security group, and RDS Proxy.
- **User_Pool**: The Amazon Cognito User Pool that manages user registration, authentication, and account recovery.
- **User_Pool_Client**: The Cognito app client configured for SRP-based authentication from the frontend.
- **Post_Confirmation_Trigger**: A Lambda function invoked by Cognito after a user confirms their account, responsible for syncing the user record to the Aurora `users` table.
- **Aurora_Cluster**: The Aurora PostgreSQL Serverless v2 database cluster with auto-scaling capacity.
- **RDS_Proxy**: The Amazon RDS Proxy that provides connection pooling between Lambda functions and the Aurora cluster.
- **CDK_App**: The CDK application entry point (`infrastructure/bin/app.ts`) that instantiates and wires all stacks.
- **cdk-nag**: A CDK aspect that runs automated security and best-practice checks (AwsSolutionsChecks) during synthesis.

## Requirements

### Requirement 1: Cognito User Pool Provisioning

**User Story:** As a developer, I want the AuthStack to provision a Cognito User Pool with email-based sign-up and auto-verification, so that end users can register and authenticate with the application.

#### Acceptance Criteria

1. THE AuthStack SHALL create a Cognito User Pool that uses email as the sign-in alias.
2. THE AuthStack SHALL configure the User_Pool to auto-verify email addresses upon sign-up.
3. THE AuthStack SHALL configure the User_Pool with a password policy requiring a minimum of 8 characters, at least one uppercase letter, one lowercase letter, one digit, and one symbol.
4. THE AuthStack SHALL configure the User_Pool with account recovery via verified email.
5. THE AuthStack SHALL configure the User_Pool with self-sign-up enabled.

### Requirement 2: Cognito User Pool Client

**User Story:** As a developer, I want a User Pool Client configured for SRP authentication, so that the frontend can securely authenticate users without exposing credentials.

#### Acceptance Criteria

1. THE AuthStack SHALL create a User_Pool_Client that supports the SRP authentication flow (`USER_SRP_AUTH`).
2. THE AuthStack SHALL configure the User_Pool_Client without a client secret, enabling browser-based authentication.
3. THE AuthStack SHALL configure the User_Pool_Client with the `COGNITO` identity provider.

### Requirement 3: Cognito User Groups

**User Story:** As a developer, I want predefined user groups in Cognito, so that the application can enforce role-based access control for admin, dealer, and regular user roles.

#### Acceptance Criteria

1. THE AuthStack SHALL create a Cognito user group named `admin`.
2. THE AuthStack SHALL create a Cognito user group named `dealer`.
3. THE AuthStack SHALL create a Cognito user group named `user`.

### Requirement 4: Post-Confirmation Lambda Trigger

**User Story:** As a developer, I want a Lambda function triggered after Cognito user confirmation, so that new users are automatically synced to the Aurora `users` table.

#### Acceptance Criteria

1. THE AuthStack SHALL create a Post_Confirmation_Trigger Lambda function using Node.js 20 runtime on ARM64 architecture.
2. WHEN a user confirms their account in the User_Pool, THE Post_Confirmation_Trigger SHALL be invoked by Cognito.
3. THE Post_Confirmation_Trigger SHALL be implemented as a stub handler that logs the event and returns success, with the actual database sync logic deferred to a later spec when the DatabaseStack connection is available.
4. THE AuthStack SHALL grant the Post_Confirmation_Trigger Lambda the minimum IAM permissions required for execution (basic Lambda execution role).

### Requirement 5: AuthStack Exports

**User Story:** As a developer, I want the AuthStack to export key resource identifiers, so that downstream stacks (ApiStack, HostingStack) can reference them via cross-stack props.

#### Acceptance Criteria

1. THE AuthStack SHALL expose the User_Pool as a public readonly property for cross-stack references.
2. THE AuthStack SHALL expose the User_Pool_Client as a public readonly property for cross-stack references.
3. THE AuthStack SHALL output the User Pool ID as a CloudFormation CfnOutput named `UserPoolId`.
4. THE AuthStack SHALL output the User Pool Client ID as a CloudFormation CfnOutput named `UserPoolClientId`.
5. THE AuthStack SHALL output the User Pool ARN as a CfnOutput named `UserPoolArn`.

### Requirement 6: VPC Provisioning

**User Story:** As a developer, I want the DatabaseStack to provision a VPC with private subnets, so that the Aurora cluster and RDS Proxy are isolated from the public internet.

#### Acceptance Criteria

1. THE DatabaseStack SHALL create a VPC in a single Availability Zone to minimize cost.
2. THE DatabaseStack SHALL create private isolated subnets for the Aurora_Cluster.
3. THE DatabaseStack SHALL configure the VPC without NAT Gateways to minimize cost, using VPC endpoints for AWS service access where needed.

### Requirement 7: Aurora Serverless v2 Cluster

**User Story:** As a developer, I want an Aurora PostgreSQL Serverless v2 cluster with auto-scaling, so that the database scales with demand while minimizing cost during low-traffic periods.

#### Acceptance Criteria

1. THE DatabaseStack SHALL create an Aurora_Cluster running PostgreSQL 15 compatible engine.
2. THE DatabaseStack SHALL configure the Aurora_Cluster with Serverless v2 scaling from 0.5 ACU minimum to 4 ACU maximum.
3. THE DatabaseStack SHALL create a writer instance in the Aurora_Cluster.
4. THE DatabaseStack SHALL place the Aurora_Cluster in the private isolated subnets of the VPC.
5. THE DatabaseStack SHALL set the default database name to `primedealauto`.
6. THE DatabaseStack SHALL configure the Aurora_Cluster with storage encryption enabled.
7. THE DatabaseStack SHALL configure the Aurora_Cluster with deletion protection disabled for the dev environment.

### Requirement 8: Secrets Manager Integration

**User Story:** As a developer, I want database credentials stored in Secrets Manager, so that credentials are never hardcoded and can be securely rotated.

#### Acceptance Criteria

1. THE DatabaseStack SHALL store the Aurora_Cluster master credentials in a Secrets Manager secret.
2. THE DatabaseStack SHALL use the CDK-managed credentials generation for the Aurora_Cluster (via `credentials: Credentials.fromGeneratedSecret()`).

### Requirement 9: Database Security Group

**User Story:** As a developer, I want a security group for the Aurora cluster, so that only authorized resources (Lambda functions via RDS Proxy) can connect on port 5432.

#### Acceptance Criteria

1. THE DatabaseStack SHALL create a security group for the Aurora_Cluster within the VPC.
2. THE DatabaseStack SHALL configure the security group to allow inbound TCP traffic on port 5432 from the RDS_Proxy security group.
3. THE DatabaseStack SHALL configure the security group to deny all other inbound traffic by default.

### Requirement 10: RDS Proxy

**User Story:** As a developer, I want an RDS Proxy in front of the Aurora cluster, so that Lambda functions can efficiently pool database connections without exhausting Aurora connection limits.

#### Acceptance Criteria

1. THE DatabaseStack SHALL create an RDS_Proxy targeting the Aurora_Cluster.
2. THE DatabaseStack SHALL configure the RDS_Proxy to use the Secrets Manager secret for database authentication.
3. THE DatabaseStack SHALL place the RDS_Proxy in the private subnets of the VPC.
4. THE DatabaseStack SHALL configure the RDS_Proxy with IAM authentication disabled (using Secrets Manager credentials instead).
5. THE DatabaseStack SHALL configure the RDS_Proxy with a security group that allows inbound TCP traffic on port 5432.
6. THE DatabaseStack SHALL configure the RDS_Proxy to require TLS for all client connections.

### Requirement 11: DatabaseStack Exports

**User Story:** As a developer, I want the DatabaseStack to export key resource identifiers and networking details, so that the ApiStack and other downstream stacks can connect to the database.

#### Acceptance Criteria

1. THE DatabaseStack SHALL expose the VPC as a public readonly property for cross-stack references.
2. THE DatabaseStack SHALL expose the Aurora_Cluster as a public readonly property for cross-stack references.
3. THE DatabaseStack SHALL expose the Secrets Manager secret as a public readonly property for cross-stack references.
4. THE DatabaseStack SHALL expose the RDS_Proxy as a public readonly property for cross-stack references.
5. THE DatabaseStack SHALL expose the database security group as a public readonly property for cross-stack references.
6. THE DatabaseStack SHALL output the cluster endpoint as a CfnOutput named `ClusterEndpoint`.
7. THE DatabaseStack SHALL output the Secret ARN as a CfnOutput named `SecretArn`.
8. THE DatabaseStack SHALL output the VPC ID as a CfnOutput named `VpcId`.
9. THE DatabaseStack SHALL output the RDS Proxy endpoint as a CfnOutput named `RdsProxyEndpoint`.

### Requirement 12: CDK App Integration

**User Story:** As a developer, I want the AuthStack and DatabaseStack instantiated in the CDK app entry point, so that they can be synthesized and deployed with a single command.

#### Acceptance Criteria

1. THE CDK_App SHALL instantiate the AuthStack with the stack name `PrimeDeals-Auth` and the hardcoded environment (account `141814481613`, region `us-east-1`).
2. THE CDK_App SHALL instantiate the DatabaseStack with the stack name `PrimeDeals-Database` and the hardcoded environment.
3. THE CDK_App SHALL pass the AuthStack's User_Pool to the DatabaseStack as a prop if the Post_Confirmation_Trigger requires VPC access in a future spec.
4. WHEN `cdk synth` is executed, THE CDK_App SHALL produce valid CloudFormation templates for both stacks without cdk-nag errors (or with documented suppressions).

### Requirement 13: cdk-nag Compliance

**User Story:** As a developer, I want both stacks to pass cdk-nag AwsSolutionsChecks, so that the infrastructure follows AWS security best practices from the start.

#### Acceptance Criteria

1. WHEN `cdk synth` is executed, THE AuthStack SHALL pass all applicable AwsSolutionsChecks rules or include documented suppressions with justification.
2. WHEN `cdk synth` is executed, THE DatabaseStack SHALL pass all applicable AwsSolutionsChecks rules or include documented suppressions with justification.
3. THE AuthStack SHALL include cdk-nag suppressions only for rules that are intentionally not applicable (with a reason string explaining the justification).
4. THE DatabaseStack SHALL include cdk-nag suppressions only for rules that are intentionally not applicable (with a reason string explaining the justification).

### Requirement 14: CDK Assertions Unit Tests

**User Story:** As a developer, I want unit tests for both stacks using CDK assertions, so that infrastructure changes are validated before deployment.

#### Acceptance Criteria

1. THE AuthStack unit test SHALL verify that the template contains a Cognito User Pool resource.
2. THE AuthStack unit test SHALL verify that the template contains a Cognito User Pool Client resource.
3. THE AuthStack unit test SHALL verify that the template contains three Cognito User Pool Group resources (admin, dealer, user).
4. THE AuthStack unit test SHALL verify that the template contains a Lambda function for the Post_Confirmation_Trigger.
5. THE DatabaseStack unit test SHALL verify that the template contains a VPC resource.
6. THE DatabaseStack unit test SHALL verify that the template contains an Aurora Serverless v2 cluster resource.
7. THE DatabaseStack unit test SHALL verify that the template contains a Secrets Manager secret resource.
8. THE DatabaseStack unit test SHALL verify that the template contains an RDS Proxy resource.
9. THE DatabaseStack unit test SHALL verify that the Aurora_Cluster is configured with the PostgreSQL engine.

### Requirement 15: Database Schema Migration

**User Story:** As a developer, I want to run the existing `schema.sql` against the deployed Aurora cluster, so that all 11 tables, indexes, and triggers are created and ready for application use.

#### Acceptance Criteria

1. WHEN the DatabaseStack is deployed, THE developer SHALL be able to connect to the Aurora_Cluster via the RDS_Proxy endpoint using credentials from Secrets Manager.
2. WHEN `schema.sql` is executed against the Aurora_Cluster, THE database SHALL contain all 11 tables defined in the schema (users, car_makes, car_models, car_variants, cars, car_images, favorites, leads, chat_sessions, chat_messages, analytics_events).
3. WHEN `schema.sql` is executed against the Aurora_Cluster, THE database SHALL contain all indexes, triggers, and check constraints defined in the schema.

### Requirement 16: Deployment Verification

**User Story:** As a developer, I want to verify that both stacks deploy successfully and resources are functional, so that I can confidently build downstream stacks on top of them.

#### Acceptance Criteria

1. WHEN the AuthStack is deployed, THE Cognito User Pool SHALL accept a test user sign-up via the AWS CLI or SDK.
2. WHEN the DatabaseStack is deployed, THE Aurora_Cluster SHALL be reachable via the RDS_Proxy endpoint from within the VPC.
3. WHEN both stacks are deployed, THE CloudFormation outputs SHALL contain all exported values (UserPoolId, UserPoolClientId, UserPoolArn, ClusterEndpoint, SecretArn, VpcId, RdsProxyEndpoint).
