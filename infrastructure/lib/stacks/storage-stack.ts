import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';
import { NagSuppressions } from 'cdk-nag';

export interface StorageStackProps extends cdk.StackProps {
  // CloudFront enabled - AWS account security hold removed 2026-03-11
  enableCloudFront?: boolean;
}

export class StorageStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly distribution?: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props?: StorageStackProps) {
    super(scope, id, props);

    // S3 Bucket for car images
    this.bucket = new s3.Bucket(this, 'CarImagesBucket', {
      versioned: false, // Versioning disabled to minimize storage costs
      blockPublicAccess: props?.enableCloudFront 
        ? s3.BlockPublicAccess.BLOCK_ALL // CloudFront OAC handles access
        : new s3.BlockPublicAccess({
            blockPublicAcls: false,
            blockPublicPolicy: false,
            ignorePublicAcls: false,
            restrictPublicBuckets: false,
          }), // Allow public read for direct S3 URLs (fallback)
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET],
          allowedOrigins: ['http://localhost:3000', 'https://primedealauto.co.za'], // Frontend domains
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
          enabled: true,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Dev only
      autoDeleteObjects: true, // Dev only
    });

    // Allow public read access on cars/* prefix only if CloudFront is disabled
    // When CloudFront is enabled, OAC handles access control
    if (!props?.enableCloudFront) {
      this.bucket.addToResourcePolicy(
        new cdk.aws_iam.PolicyStatement({
          effect: cdk.aws_iam.Effect.ALLOW,
          principals: [new cdk.aws_iam.AnyPrincipal()],
          actions: ['s3:GetObject'],
          resources: [`${this.bucket.bucketArn}/cars/*`],
        })
      );
    }

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

      // Grant CloudFront OAC read access to S3 bucket
      this.bucket.addToResourcePolicy(
        new cdk.aws_iam.PolicyStatement({
          effect: cdk.aws_iam.Effect.ALLOW,
          principals: [new cdk.aws_iam.ServicePrincipal('cloudfront.amazonaws.com')],
          actions: ['s3:GetObject'],
          resources: [`${this.bucket.bucketArn}/*`],
          conditions: {
            StringEquals: {
              'AWS:SourceArn': `arn:aws:cloudfront::${cdk.Stack.of(this).account}:distribution/${this.distribution.distributionId}`,
            },
          },
        })
      );
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

    // Keep old export for backward compatibility during CloudFront transition
    // This export is used by ApiStack - will be removed after ApiStack migrates to CloudFront
    new cdk.CfnOutput(this, 'BucketRegionalDomainName', {
      value: this.bucket.bucketRegionalDomainName,
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
      {
        id: 'AwsSolutions-S2',
        reason: props?.enableCloudFront 
          ? 'Public access blocked - CloudFront OAC handles all access control'
          : 'Public read access intentionally enabled for cars/* prefix to serve car images directly via S3 URLs. CloudFront with OAC is the preferred approach but can be disabled. Public write access is blocked - uploads only via presigned URLs.',
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
