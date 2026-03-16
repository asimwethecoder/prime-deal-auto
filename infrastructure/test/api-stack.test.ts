import { describe, test, expect, beforeAll } from 'vitest';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { ApiStack } from '../lib/stacks/api-stack';

describe('ApiStack', () => {
  let template: Template;

  beforeAll(() => {
    const app = new cdk.App();

    // Create mock dependencies in a separate stack
    const mockStack = new cdk.Stack(app, 'MockStack');

    const vpc = new ec2.Vpc(mockStack, 'Vpc', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        { name: 'isolated', subnetType: ec2.SubnetType.PRIVATE_ISOLATED, cidrMask: 24 },
      ],
    });

    const proxySecurityGroup = new ec2.SecurityGroup(mockStack, 'ProxySG', {
      vpc,
      description: 'Mock RDS Proxy security group',
    });

    const userPool = new cognito.UserPool(mockStack, 'UserPool');

    const bucket = new s3.Bucket(mockStack, 'Bucket');

    const distribution = new cloudfront.Distribution(mockStack, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3StaticWebsiteOrigin(bucket),
      },
    });

    // Create a mock Aurora cluster for the proxy
    const cluster = new rds.DatabaseCluster(mockStack, 'Cluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_15,
      }),
      writer: rds.ClusterInstance.serverlessV2('writer'),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });

    const rdsProxy = new rds.DatabaseProxy(mockStack, 'Proxy', {
      proxyTarget: rds.ProxyTarget.fromCluster(cluster),
      secrets: [cluster.secret!],
      vpc,
    });

    const dbSecret = cluster.secret!;

    // Create the ApiStack
    const stack = new ApiStack(app, 'TestApiStack', {
      userPool,
      vpc,
      proxySecurityGroupId: proxySecurityGroup.securityGroupId,
      rdsProxy,
      dbSecret,
      bucket,
      distribution,
    });

    template = Template.fromStack(stack);
  });

  // Property 4: API Gateway Configuration
  describe('API Gateway Configuration', () => {
    test('REST API has Lambda proxy integration', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        Integration: {
          Type: 'AWS_PROXY',
        },
      });
    });

    test('API Gateway has Cognito authorizer', () => {
      template.hasResourceProperties('AWS::ApiGateway::Authorizer', {
        Type: 'COGNITO_USER_POOLS',
      });
    });

    test('API Gateway has caching enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        CacheClusterEnabled: true,
        CacheClusterSize: '0.5',
      });
    });

    test('API Gateway has throttling configured', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            ThrottlingBurstLimit: 100,
            ThrottlingRateLimit: 50,
          }),
        ]),
      });
    });
  });

  // Property 5: Lambda Function Configuration
  describe('Lambda Function Configuration', () => {
    test('Lambda has Node.js 20 runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
      });
    });

    test('Lambda has ARM64 architecture', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Architectures: ['arm64'],
      });
    });

    test('Lambda has 1024 MB memory', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        MemorySize: 1024,
      });
    });

    test('Lambda has 120 second timeout', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Timeout: 120,
      });
    });

    test('Lambda has required environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            DB_HOST: Match.anyValue(),
            DB_NAME: 'primedealauto',
            SECRET_ARN: Match.anyValue(),
            S3_BUCKET: Match.anyValue(),
            CLOUDFRONT_URL: Match.anyValue(),
          },
        },
      });
    });

    test('Lambda is VPC-attached', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: {
          SubnetIds: Match.anyValue(),
          SecurityGroupIds: Match.anyValue(),
        },
      });
    });
  });

  // Property 14: Lambda Security Group Egress
  describe('Lambda Security Group', () => {
    test('Lambda security group allows egress to RDS on port 5432', () => {
      // CDK embeds egress rules in the SecurityGroup resource, not as separate SecurityGroupEgress resources
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 5432,
            ToPort: 5432,
          }),
        ]),
      });
    });
  });

  // Property 15: CloudFormation Outputs
  describe('CloudFormation Outputs', () => {
    test('ApiUrl output exists', () => {
      template.hasOutput('ApiUrl', {});
    });

    test('ApiId output exists', () => {
      template.hasOutput('ApiId', {});
    });
  });
});
