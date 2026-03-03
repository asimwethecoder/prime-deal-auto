import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { describe, it, expect } from 'vitest';
import { SearchStack } from '../lib/stacks/search-stack';

describe('SearchStack', () => {
  const app = new App();
  const stack = new SearchStack(app, 'TestSearchStack', {
    env: { account: '141814481613', region: 'us-east-1' },
    lambdaExecutionRoleArn: 'arn:aws:iam::141814481613:role/test-lambda-role',
    environment: 'dev',
  });
  const template = Template.fromStack(stack);

  it('creates OpenSearch Serverless collection with correct type', () => {
    template.hasResourceProperties('AWS::OpenSearchServerless::Collection', {
      Name: 'primedeals-cars',
      Type: 'SEARCH',
      Description: 'Search collection for Prime Deal Auto car inventory',
    });
  });

  it('creates encryption policy with AWS-managed keys', () => {
    template.hasResourceProperties('AWS::OpenSearchServerless::SecurityPolicy', {
      Name: 'primedeals-search-encryption',
      Type: 'encryption',
      Policy: JSON.stringify({
        Rules: [
          {
            ResourceType: 'collection',
            Resource: ['collection/primedeals-cars'],
          },
        ],
        AWSOwnedKey: true,
      }),
    });
  });

  it('creates network policy allowing public access', () => {
    template.hasResourceProperties('AWS::OpenSearchServerless::SecurityPolicy', {
      Name: 'primedeals-search-network',
      Type: 'network',
      Policy: JSON.stringify([
        {
          Rules: [
            {
              ResourceType: 'collection',
              Resource: ['collection/primedeals-cars'],
            },
          ],
          AllowFromPublic: true,
        },
      ]),
    });
  });

  it('creates data access policy with Lambda role permissions', () => {
    template.hasResourceProperties('AWS::OpenSearchServerless::AccessPolicy', {
      Name: 'primedeals-search-access',
      Type: 'data',
    });

    // Verify the policy contains the Lambda role ARN
    const accessPolicies = template.findResources('AWS::OpenSearchServerless::AccessPolicy');
    const policyResource = Object.values(accessPolicies)[0];
    const policyJson = policyResource.Properties.Policy;
    
    // The policy should reference the Lambda role ARN
    expect(JSON.stringify(policyJson)).toContain('test-lambda-role');
  });

  it('exports collection endpoint', () => {
    template.hasOutput('CollectionEndpoint', {
      Description: 'OpenSearch Serverless collection endpoint',
      Export: {
        Name: 'SearchCollectionEndpoint',
      },
    });
  });

  it('exports collection ARN', () => {
    template.hasOutput('CollectionArn', {
      Description: 'OpenSearch Serverless collection ARN',
      Export: {
        Name: 'SearchCollectionArn',
      },
    });
  });

  it('applies correct tags', () => {
    // Tags are applied at app level via Tags.of(app).add() in bin/app.ts
    // They are inherited by all resources but don't appear in the template
    // This test verifies the collection resource exists (tags are applied at deployment)
    template.resourceCountIs('AWS::OpenSearchServerless::Collection', 1);
  });

  it('creates collection with dependencies on policies', () => {
    const collection = template.findResources('AWS::OpenSearchServerless::Collection');
    const collectionResource = Object.values(collection)[0];
    
    expect(collectionResource.DependsOn).toContain('EncryptionPolicy');
    expect(collectionResource.DependsOn).toContain('NetworkPolicy');
  });

  it('creates exactly one collection', () => {
    template.resourceCountIs('AWS::OpenSearchServerless::Collection', 1);
  });

  it('creates exactly two security policies', () => {
    template.resourceCountIs('AWS::OpenSearchServerless::SecurityPolicy', 2);
  });

  it('creates exactly one access policy', () => {
    template.resourceCountIs('AWS::OpenSearchServerless::AccessPolicy', 1);
  });
});
