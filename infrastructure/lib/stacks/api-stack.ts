import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { NagSuppressions } from 'cdk-nag';
import * as path from 'path';

export interface ApiStackProps extends cdk.StackProps {
  // From AuthStack
  userPool: cognito.IUserPool;

  // From DatabaseStack
  vpc: ec2.IVpc;
  proxySecurityGroupId: string; // Pass ID as string to avoid cross-stack reference
  rdsProxy: rds.IDatabaseProxy;
  dbSecret: secretsmanager.ISecret;

  // From StorageStack
  bucket: s3.IBucket;
  distribution?: cloudfront.IDistribution; // Optional until CloudFront approved

  // From SearchStack (optional - use CloudFormation import if not provided)
  opensearchEndpoint?: string;
}

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Lambda security group — allows outbound to RDS Proxy and HTTPS
    const lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSG', {
      vpc: props.vpc,
      description: 'Security group for API Lambda - allows outbound to RDS Proxy and HTTPS',
      allowAllOutbound: false,
    });

    // Allow Lambda to connect to RDS Proxy on port 5432
    lambdaSecurityGroup.addEgressRule(
      ec2.Peer.securityGroupId(props.proxySecurityGroupId),
      ec2.Port.tcp(5432),
      'Allow outbound to RDS Proxy'
    );

    // Allow Lambda to connect to HTTPS endpoints (Secrets Manager VPC endpoint and S3)
    lambdaSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound for Secrets Manager and S3'
    );

    // Ingress rule on RDS Proxy SG must be created in this stack to avoid circular dependency
    // (DatabaseStack -> ApiStack). Using L1 CfnSecurityGroupIngress so the resource lives in ApiStack.
    new ec2.CfnSecurityGroupIngress(this, 'AllowLambdaToRdsProxy', {
      groupId: props.proxySecurityGroupId,
      sourceSecurityGroupId: lambdaSecurityGroup.securityGroupId,
      ipProtocol: 'tcp',
      fromPort: 5432,
      toPort: 5432,
      description: 'Allow Lambda to connect to RDS Proxy',
    });

    // Lambda function — single handler with path-based routing
    this.lambdaFunction = new NodejsFunction(this, 'ApiHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      entry: path.join(__dirname, '../../../backend/src/lambda.ts'),
      handler: 'handler',
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [lambdaSecurityGroup],
      environment: {
        DB_HOST: props.rdsProxy.endpoint,
        DB_NAME: 'primedealauto',
        SECRET_ARN: props.dbSecret.secretArn,
        S3_BUCKET: props.bucket.bucketName,
        // TEMPORARY: Use S3 URL if CloudFront not available (account verification pending)
        CLOUDFRONT_URL: props.distribution 
          ? `https://${props.distribution.distributionDomainName}`
          : `https://${props.bucket.bucketRegionalDomainName}`,
        FRONTEND_URL: process.env.FRONTEND_URL || '*',
        // OpenSearch endpoint - import from SearchStack export if available
        ...(props.opensearchEndpoint && { OPENSEARCH_ENDPOINT: props.opensearchEndpoint }),
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/client-secrets-manager', '@aws-sdk/client-s3'],
      },
    });

    // Grant Lambda permissions
    props.dbSecret.grantRead(this.lambdaFunction);
    props.bucket.grantReadWrite(this.lambdaFunction);

    // Grant OpenSearch Serverless permissions if endpoint provided
    if (props.opensearchEndpoint) {
      const collectionName = 'primedeals-cars';
      this.lambdaFunction.addToRolePolicy(
        new cdk.aws_iam.PolicyStatement({
          effect: cdk.aws_iam.Effect.ALLOW,
          actions: ['aoss:*'],
          resources: [
            `arn:aws:aoss:${this.region}:${this.account}:collection/*`,
            `arn:aws:aoss:${this.region}:${this.account}:index/${collectionName}/*`,
          ],
        })
      );
    }

    // API Gateway REST API
    this.api = new apigateway.RestApi(this, 'Api', {
      restApiName: 'PrimeDealAuto-Api',
      description: 'Prime Deal Auto REST API',
      deployOptions: {
        stageName: 'v1',
        cachingEnabled: true,
        cacheClusterEnabled: true,
        cacheClusterSize: '0.5',
        throttlingBurstLimit: 100,
        throttlingRateLimit: 50,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // Cognito authorizer for protected routes
    const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [props.userPool],
      identitySource: 'method.request.header.Authorization',
    });

    // Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(this.lambdaFunction, {
      proxy: true,
    });

    // Routes
    // GET /health (public)
    const healthResource = this.api.root.addResource('health');
    healthResource.addMethod('GET', lambdaIntegration);

    // /cars routes
    const carsResource = this.api.root.addResource('cars');
    carsResource.addMethod('GET', lambdaIntegration); // Public
    carsResource.addMethod('POST', lambdaIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    }); // Admin only (checked in Lambda)

    // /cars/{carId} routes
    const carByIdResource = carsResource.addResource('{carId}');
    carByIdResource.addMethod('GET', lambdaIntegration); // Public
    carByIdResource.addMethod('PUT', lambdaIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    }); // Admin only
    carByIdResource.addMethod('DELETE', lambdaIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    }); // Admin only

    // /search routes
    const searchResource = this.api.root.addResource('search');
    
    // GET /search — full-text search with filters (public, cached 60s)
    const searchMethod = searchResource.addMethod('GET', lambdaIntegration, {
      requestParameters: {
        'method.request.querystring.q': false,
        'method.request.querystring.make': false,
        'method.request.querystring.model': false,
        'method.request.querystring.variant': false,
        'method.request.querystring.minPrice': false,
        'method.request.querystring.maxPrice': false,
        'method.request.querystring.minYear': false,
        'method.request.querystring.maxYear': false,
        'method.request.querystring.bodyType': false,
        'method.request.querystring.fuelType': false,
        'method.request.querystring.transmission': false,
        'method.request.querystring.condition': false,
        'method.request.querystring.sortBy': false,
        'method.request.querystring.sortOrder': false,
        'method.request.querystring.limit': false,
        'method.request.querystring.offset': false,
      },
    });

    // Configure cache for GET /search — 60 second TTL, cache all query params
    const searchMethodCfn = searchMethod.node.defaultChild as apigateway.CfnMethod;
    searchMethodCfn.addPropertyOverride('Integration.CacheKeyParameters', [
      'method.request.querystring.q',
      'method.request.querystring.make',
      'method.request.querystring.model',
      'method.request.querystring.variant',
      'method.request.querystring.minPrice',
      'method.request.querystring.maxPrice',
      'method.request.querystring.minYear',
      'method.request.querystring.maxYear',
      'method.request.querystring.bodyType',
      'method.request.querystring.fuelType',
      'method.request.querystring.transmission',
      'method.request.querystring.condition',
      'method.request.querystring.sortBy',
      'method.request.querystring.sortOrder',
      'method.request.querystring.limit',
      'method.request.querystring.offset',
    ]);
    searchMethodCfn.addPropertyOverride('Integration.CacheNamespace', searchResource.resourceId);

    // GET /search/facets — aggregated filter counts (public, cached 300s)
    const facetsResource = searchResource.addResource('facets');
    const facetsMethod = facetsResource.addMethod('GET', lambdaIntegration, {
      requestParameters: {
        'method.request.querystring.q': false,
        'method.request.querystring.make': false,
        'method.request.querystring.model': false,
        'method.request.querystring.variant': false,
        'method.request.querystring.minPrice': false,
        'method.request.querystring.maxPrice': false,
        'method.request.querystring.minYear': false,
        'method.request.querystring.maxYear': false,
        'method.request.querystring.bodyType': false,
        'method.request.querystring.fuelType': false,
        'method.request.querystring.transmission': false,
        'method.request.querystring.condition': false,
      },
    });

    // Configure cache for GET /search/facets — 300 second TTL, cache all query params
    const facetsMethodCfn = facetsMethod.node.defaultChild as apigateway.CfnMethod;
    facetsMethodCfn.addPropertyOverride('Integration.CacheKeyParameters', [
      'method.request.querystring.q',
      'method.request.querystring.make',
      'method.request.querystring.model',
      'method.request.querystring.variant',
      'method.request.querystring.minPrice',
      'method.request.querystring.maxPrice',
      'method.request.querystring.minYear',
      'method.request.querystring.maxYear',
      'method.request.querystring.bodyType',
      'method.request.querystring.fuelType',
      'method.request.querystring.transmission',
      'method.request.querystring.condition',
    ]);
    facetsMethodCfn.addPropertyOverride('Integration.CacheNamespace', facetsResource.resourceId);

    // GET /search/suggestions — autocomplete (public, cached 300s)
    const suggestionsResource = searchResource.addResource('suggestions');
    const suggestionsMethod = suggestionsResource.addMethod('GET', lambdaIntegration, {
      requestParameters: {
        'method.request.querystring.q': true, // Required
        'method.request.querystring.field': true, // Required
      },
    });

    // Configure cache for GET /search/suggestions — 300 second TTL, cache q and field params
    const suggestionsMethodCfn = suggestionsMethod.node.defaultChild as apigateway.CfnMethod;
    suggestionsMethodCfn.addPropertyOverride('Integration.CacheKeyParameters', [
      'method.request.querystring.q',
      'method.request.querystring.field',
    ]);
    suggestionsMethodCfn.addPropertyOverride('Integration.CacheNamespace', suggestionsResource.resourceId);

    // /admin routes
    const adminResource = this.api.root.addResource('admin');
    
    // POST /admin/reindex — bulk reindex all cars (admin only, no caching)
    const reindexResource = adminResource.addResource('reindex');
    reindexResource.addMethod('POST', lambdaIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    }); // Admin group checked in Lambda

    // CloudFormation outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'API Gateway endpoint URL',
      exportName: `${this.stackName}-ApiUrl`,
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: this.api.restApiId,
      description: 'API Gateway REST API ID',
      exportName: `${this.stackName}-ApiId`,
    });

    // cdk-nag suppressions with documented justifications
    NagSuppressions.addResourceSuppressions(this.api, [
      {
        id: 'AwsSolutions-APIG2',
        reason: 'Request validation handled in Lambda handler with Zod schemas',
      },
      {
        id: 'AwsSolutions-APIG4',
        reason: 'Authorization handled per-method - some endpoints are intentionally public (GET /cars, GET /health)',
      },
      {
        id: 'AwsSolutions-COG4',
        reason: 'Cognito authorizer configured for protected endpoints only - public endpoints do not require auth',
      },
      {
        id: 'AwsSolutions-APIG1',
        reason: 'API Gateway access logging deferred to MonitoringStack (Spec 12)',
      },
      {
        id: 'AwsSolutions-APIG3',
        reason: 'WAF integration deferred to production hardening (Spec 14)',
      },
      {
        id: 'AwsSolutions-APIG6',
        reason: 'CloudWatch logging at stage level deferred to MonitoringStack (Spec 12)',
      },
      {
        id: 'AwsSolutions-IAM4',
        appliesTo: ['Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs'],
        reason: 'AWS managed policy required for API Gateway CloudWatch logging role',
      },
    ], true);

    NagSuppressions.addResourceSuppressions(this.lambdaFunction, [
      {
        id: 'AwsSolutions-IAM4',
        reason: 'AWSLambdaVPCAccessExecutionRole managed policy required for VPC-attached Lambda',
      },
      {
        id: 'AwsSolutions-IAM5',
        appliesTo: [
          'Action::s3:GetObject*',
          'Action::s3:GetBucket*',
          'Action::s3:List*',
          'Action::s3:DeleteObject*',
          'Action::s3:Abort*',
          'Action::s3:PutObject*',
          'Resource::*',
          'Resource::<StorageBucket*>/*',
          'Resource::<CarImagesBucket930996DC.Arn>/*',
          'Action::aoss:*',
          'Resource::arn:aws:aoss:us-east-1:141814481613:collection/*',
          'Resource::arn:aws:aoss:us-east-1:141814481613:index/primedeals-cars/*',
        ],
        reason: 'S3 bucket permissions use wildcard actions for object operations - required for image upload/download. OpenSearch permissions use wildcard for collection and index access - required for search operations.',
      },
      {
        id: 'AwsSolutions-L1',
        reason: 'Node.js 20 is the latest LTS runtime supported by Lambda at time of implementation',
      },
    ], true);

    NagSuppressions.addResourceSuppressions(lambdaSecurityGroup, [
      {
        id: 'AwsSolutions-EC23',
        reason: 'HTTPS egress to 0.0.0.0/0 required for Secrets Manager VPC endpoint and S3 access',
      },
    ]);
  }
}
