import { describe, test, expect, beforeAll } from 'vitest';
import { Template } from 'aws-cdk-lib/assertions';
import * as cdk from 'aws-cdk-lib';
import { StorageStack } from '../lib/stacks/storage-stack';

describe('StorageStack', () => {
  let template: Template;
  const enableCloudFront = false; // Match actual deployment config

  beforeAll(() => {
    const app = new cdk.App();
    const stack = new StorageStack(app, 'TestStorageStack', {
      enableCloudFront,
    });
    template = Template.fromStack(stack);
  });

  // Property 1: S3 Bucket Security Configuration
  describe('S3 Bucket Security', () => {
    test('S3 bucket has versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: { Status: 'Enabled' },
      });
    });

    test('S3 bucket blocks all public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('S3 bucket has SSE-S3 encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });
    });
  });

  // Property 2: CloudFront OAC Configuration
  describe.skipIf(!enableCloudFront)('CloudFront OAC', () => {
    test('CloudFront Origin Access Control exists', () => {
      template.resourceCountIs('AWS::CloudFront::OriginAccessControl', 1);
    });

    test('CloudFront distribution exists', () => {
      template.resourceCountIs('AWS::CloudFront::Distribution', 1);
    });

    test('CloudFront uses HTTPS redirect', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            ViewerProtocolPolicy: 'redirect-to-https',
          },
        },
      });
    });
  });

  // Property 3: CloudFront Price Class
  describe.skipIf(!enableCloudFront)('CloudFront Price Class', () => {
    test('CloudFront uses PriceClass_100', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          PriceClass: 'PriceClass_100',
        },
      });
    });
  });

  // CloudFormation Outputs
  describe('CloudFormation Outputs', () => {
    test('BucketName output exists', () => {
      template.hasOutput('BucketName', {});
    });

    test('BucketArn output exists', () => {
      template.hasOutput('BucketArn', {});
    });

    test.skipIf(!enableCloudFront)('DistributionId output exists', () => {
      template.hasOutput('DistributionId', {});
    });

    test.skipIf(!enableCloudFront)('DistributionDomainName output exists', () => {
      template.hasOutput('DistributionDomainName', {});
    });
  });
});
