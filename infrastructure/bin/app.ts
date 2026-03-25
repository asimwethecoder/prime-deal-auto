#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Aspects, Tags } from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';
import { AuthStack } from '../lib/stacks/auth-stack';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { StorageStack } from '../lib/stacks/storage-stack';
import { ApiStack } from '../lib/stacks/api-stack';
import { MigrationStack } from '../lib/stacks/migration-stack';
import { HostingStack } from '../lib/stacks/hosting-stack';

const app = new cdk.App();

// Hardcoded account and region — never deploy elsewhere
const env: cdk.Environment = {
  account: '141814481613',
  region: 'us-east-1',
};

// Global tags
Tags.of(app).add('Project', 'PrimeDealAuto');
Tags.of(app).add('Environment', 'dev');

// cdk-nag security checks
Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));

// Spec 2: Auth + Database stacks
const authStack = new AuthStack(app, 'PrimeDeals-Auth', { env });
const databaseStack = new DatabaseStack(app, 'PrimeDeals-Database', { env });

// Spec 3: Storage + API stacks
// CloudFront testing: AWS Support says issue is resolved, testing access
const storageStack = new StorageStack(app, 'PrimeDeals-Storage', { 
  env,
  enableCloudFront: true, // Testing if CloudFront access is now working
});

const apiStack = new ApiStack(app, 'PrimeDeals-Api', {
  env,
  userPool: authStack.userPool,
  vpc: databaseStack.vpc,
  proxySecurityGroupId: cdk.Fn.importValue(`${databaseStack.stackName}-ProxySecurityGroupId`),
  rdsProxy: databaseStack.proxy,
  dbSecret: databaseStack.secret,
  smtpSecret: databaseStack.smtpSecret,
  bucket: storageStack.bucket,
  distribution: storageStack.distribution,
});

// Explicit dependencies
apiStack.addDependency(authStack);
apiStack.addDependency(databaseStack);
apiStack.addDependency(storageStack);

// Migration stack (temporary - for running database migrations)
const migrationStack = new MigrationStack(app, 'PrimeDeals-Migration', {
  env,
  vpc: databaseStack.vpc,
  proxySecurityGroupId: cdk.Fn.importValue(`${databaseStack.stackName}-ProxySecurityGroupId`),
  rdsProxy: databaseStack.proxy,
  dbSecret: databaseStack.secret,
});

migrationStack.addDependency(databaseStack);

// Spec 4: Hosting stack (Amplify)
const hostingStack = new HostingStack(app, 'PrimeDeals-Hosting', {
  env,
  apiUrl: apiStack.api.url,
});

// HostingStack depends on ApiStack (needs API URL)
hostingStack.addDependency(apiStack);

// DEPLOYMENT:
//   npx cdk deploy --all --profile prime-deal-auto
//
// Search: PostgreSQL full-text search (tsvector). OpenSearch Serverless removed to cut costs.

// Future stacks (added in subsequent specs):
// - PrimeDeals-Monitoring (Spec 12)
