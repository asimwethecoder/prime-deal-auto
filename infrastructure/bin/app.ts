#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Aspects, Tags } from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';
import { AuthStack } from '../lib/stacks/auth-stack';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { StorageStack } from '../lib/stacks/storage-stack';
import { ApiStack } from '../lib/stacks/api-stack';
import { SearchStack } from '../lib/stacks/search-stack';
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
  bucket: storageStack.bucket,
  distribution: storageStack.distribution,
  // OpenSearch endpoint - uncomment after SearchStack is deployed to enable search functionality
  opensearchEndpoint: cdk.Fn.importValue('SearchCollectionEndpoint'),
});

// Explicit dependencies
apiStack.addDependency(authStack);
apiStack.addDependency(databaseStack);
apiStack.addDependency(storageStack);

// Spec 9: Search stack
const searchStack = new SearchStack(app, 'PrimeDeals-Search', {
  env,
  lambdaExecutionRoleArn: apiStack.lambdaFunction.role!.roleArn,
  environment: 'dev',
  vpc: databaseStack.vpc,
  lambdaSecurityGroup: apiStack.lambdaSecurityGroup,
});

// SearchStack depends on ApiStack (needs Lambda role ARN and security group)
searchStack.addDependency(apiStack);

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

// DEPLOYMENT INSTRUCTIONS:
// Due to circular dependency (SearchStack needs ApiStack role, ApiStack needs SearchStack endpoint),
// use this two-stage deployment:
//
// Stage 1 (completed): Deploy ApiStack → Deploy SearchStack
//   npx cdk deploy PrimeDeals-Api --profile prime-deal-auto
//   npx cdk deploy PrimeDeals-Search --profile prime-deal-auto
//
// Stage 2 (to enable OpenSearch in Lambda):
//   1. Uncomment the opensearchEndpoint line above in ApiStack props
//   2. Redeploy ApiStack: npx cdk deploy PrimeDeals-Api --profile prime-deal-auto
//   3. Lambda will now have OPENSEARCH_ENDPOINT env var and aoss:* IAM permissions

// Future stacks (added in subsequent specs):
// - PrimeDeals-Monitoring (Spec 12)
