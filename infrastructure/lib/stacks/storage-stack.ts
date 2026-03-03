import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';
import { NagSuppressions } from 'cdk-nag';

export interface StorageStackProps extends cdk.StackProps {
  // TEMPORARY: CloudFront disabled due to AWS account verification requirement
  // TODO: Set to true once AWS Support approves CloudFront access (ticket raised 2026-02-28)
  enableCloudFront?: boolean;
}

export class StorageStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly distribution?: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props?: StorageStackProps) {
    super(scope, id, props);

    // S3 Bucket for car images
    this.bucket = new s3.Bucket(this, 'CarImagesBucket', {
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ['*'], // Tightened in production
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Dev only
      autoDeleteObjects: true, // Dev only
    });

    // TEMPORARY: CloudFront creation conditional on enableCloudFront flag
    if (props?.enableCloudFront) {
      // Origin Access Control for CloudFront
      const oac = new cloudfront.S3OriginAccessControl(this, 'OAC', {
        signing: cloudfront.Signing.SIGV4_ALWAYS,
      });

      // CloudFront Distribution
      this.distribution = new cloudfront.Distribution(this, 'Distribution', {
        defaultBehavior: {
          origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket, {
            originAccessControl: oac,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        },
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      });
    }

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      exportName: 'PrimeDeals-Storage-BucketName',
    });

    new cdk.CfnOutput(this, 'BucketArn', {
      value: this.bucket.bucketArn,
      exportName: 'PrimeDeals-Storage-BucketArn',
    });

    if (this.distribution) {
      new cdk.CfnOutput(this, 'DistributionId', {
        value: this.distribution.distributionId,
        exportName: 'PrimeDeals-Storage-DistributionId',
      });

      new cdk.CfnOutput(this, 'DistributionDomainName', {
        value: this.distribution.distributionDomainName,
        exportName: 'PrimeDeals-Storage-DistributionDomainName',
      });
    }

    // cdk-nag suppressions with documented justifications
    NagSuppressions.addResourceSuppressions(this.bucket, [
      {
        id: 'AwsSolutions-S1',
        reason: 'S3 access logging deferred to MonitoringStack (Spec 12)',
      },
    ]);

    if (this.distribution) {
      NagSuppressions.addResourceSuppressions(this.distribution, [
        {
          id: 'AwsSolutions-CFR1',
          reason: 'Geo restrictions not required for car dealership serving South Africa',
        },
        {
          id: 'AwsSolutions-CFR2',
          reason: 'WAF integration deferred to production hardening (Spec 14)',
        },
        {
          id: 'AwsSolutions-CFR3',
          reason: 'CloudFront access logging deferred to MonitoringStack (Spec 12)',
        },
        {
          id: 'AwsSolutions-CFR4',
          reason: 'Custom SSL certificate deferred - using CloudFront default certificate for dev',
        },
      ]);
    }
  }
}
