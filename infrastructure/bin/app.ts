#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Aspects, Tags } from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';
import { AuthStack } from '../lib/stacks/auth-stack';
import { DatabaseStack } from '../lib/stacks/database-stack';

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
new AuthStack(app, 'PrimeDeals-Auth', { env });
new DatabaseStack(app, 'PrimeDeals-Database', { env });

// Future stacks (added in subsequent specs):
// - PrimeDeals-Storage (Spec 3)
// - PrimeDeals-Api (Spec 3)
// - PrimeDeals-Search (Spec 9)
// - PrimeDeals-Monitoring (Spec 12)
// - PrimeDeals-Hosting (Spec 4)
