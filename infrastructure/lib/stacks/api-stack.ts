import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { NagSuppressions } from 'cdk-nag';
import * as path from 'path';
import { afterBundlingCopyRdsCaBundle } from '../bundle-rds-ca';

export interface ApiStackProps extends cdk.StackProps {
  // From AuthStack
  userPool: cognito.IUserPool;

  // From DatabaseStack
  vpc: ec2.IVpc;
  auroraClusterEndpoint: string; // Aurora writer hostname for DB_HOST
  dbSecurityGroupId: string; // Aurora DB security group ID for direct connectivity
  dbSecret: secretsmanager.ISecret;
  smtpSecret: secretsmanager.ISecret;

  // From StorageStack
  bucket: s3.IBucket;
  distribution?: cloudfront.IDistribution; // Optional until CloudFront approved
}

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly lambdaFunction: lambda.Function;
  public readonly lambdaSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Lambda security group — allows outbound to Aurora on 5432 and HTTPS
    this.lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSG', {
      vpc: props.vpc,
      description: 'Security group for API Lambda - outbound to Aurora :5432 and HTTPS',
      allowAllOutbound: false,
    });

    this.lambdaSecurityGroup.addEgressRule(
      ec2.Peer.securityGroupId(props.dbSecurityGroupId),
      ec2.Port.tcp(5432),
      'Allow outbound to Aurora'
    );

    // Allow Lambda to connect to HTTPS endpoints (Secrets Manager VPC endpoint and S3)
    this.lambdaSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound for Secrets Manager and S3'
    );

    // Ingress on Aurora DB SG — lives in ApiStack to avoid DatabaseStack ↔ ApiStack circular dependency
    const allowLambdaToAurora = new ec2.CfnSecurityGroupIngress(this, 'AllowLambdaToAurora', {
      groupId: props.dbSecurityGroupId,
      sourceSecurityGroupId: this.lambdaSecurityGroup.securityGroupId,
      ipProtocol: 'tcp',
      fromPort: 5432,
      toPort: 5432,
      description: 'Allow Lambda to connect to Aurora directly',
    });
    NagSuppressions.addResourceSuppressions(allowLambdaToAurora, [
      {
        id: 'AwsSolutions-EC23',
        reason: 'Ingress is scoped to the Lambda security group only, not open to the internet',
      },
    ]);

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
      securityGroups: [this.lambdaSecurityGroup],
      environment: {
        DB_HOST: props.auroraClusterEndpoint,
        DB_NAME: 'primedealauto',
        SECRET_ARN: props.dbSecret.secretArn,
        SMTP_SECRET_ARN: props.smtpSecret.secretArn,
        S3_BUCKET: props.bucket.bucketName,
        // CloudFront domain for serving images (uses CloudFront if available, otherwise S3 direct)
        ...(props.distribution && { CLOUDFRONT_DOMAIN: props.distribution.distributionDomainName }),
        // CORS: Allow all origins since we have multiple frontends (localhost, Amplify)
        FRONTEND_URL: '*',
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: [
          '@aws-sdk/client-secrets-manager',
          '@aws-sdk/client-s3',
          '@aws-sdk/s3-request-presigner',
        ],
        commandHooks: {
          beforeBundling(): string[] {
            return [];
          },
          beforeInstall(): string[] {
            return [];
          },
          afterBundling(_inputDir: string, outputDir: string): string[] {
            return afterBundlingCopyRdsCaBundle(outputDir);
          },
        },
      },
    });

    // Grant Lambda permissions
    props.dbSecret.grantRead(this.lambdaFunction);
    props.smtpSecret.grantRead(this.lambdaFunction);
    props.bucket.grantReadWrite(this.lambdaFunction);

    // Grant Bedrock permissions for AI Chat Assistant
    this.lambdaFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['bedrock:InvokeModel'],
        resources: [
          `arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-sonnet-4-20250514-v1:0`,
        ],
      })
    );

    // ========================================
    // VPC Proxy Lambda Pattern for Chat
    // ========================================
    // This pattern avoids NAT Gateway costs (~$33-70/month) by using:
    // - Chat Lambda (no VPC) → calls Bedrock directly
    // - VPC Proxy Lambda (VPC) → handles database operations
    // Cost: ~$0-2/month for extra Lambda invocations
    // Reference: https://serverlessfirst.com/lambda-vpc-internet-access-no-nat-gateway/

    // VPC Proxy Lambda — handles all database operations from inside VPC
    const vpcProxyLambda = new NodejsFunction(this, 'VpcProxyHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      entry: path.join(__dirname, '../../../backend/src/vpc-proxy.ts'),
      handler: 'handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [this.lambdaSecurityGroup],
      environment: {
        DB_HOST: props.auroraClusterEndpoint,
        DB_NAME: 'primedealauto',
        SECRET_ARN: props.dbSecret.secretArn,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/client-secrets-manager'],
        commandHooks: {
          beforeBundling(): string[] {
            return [];
          },
          beforeInstall(): string[] {
            return [];
          },
          afterBundling(_inputDir: string, outputDir: string): string[] {
            return afterBundlingCopyRdsCaBundle(outputDir);
          },
        },
      },
    });

    // Grant VPC Proxy Lambda permissions
    props.dbSecret.grantRead(vpcProxyLambda);

    // Suppress cdk-nag warnings for VPC Proxy Lambda
    NagSuppressions.addResourceSuppressions(
      vpcProxyLambda,
      [
        {
          id: 'AwsSolutions-IAM4',
          reason: 'AWS managed policies (AWSLambdaBasicExecutionRole, AWSLambdaVPCAccessExecutionRole) are acceptable for Lambda execution roles',
          appliesTo: [
            'Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
            'Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
          ],
        },
        {
          id: 'AwsSolutions-L1',
          reason: 'Using Node.js 20 which is the latest LTS runtime supported by CDK',
        },
      ],
      true // Apply to children (role, etc.)
    );

    // Chat Lambda — NOT in VPC, can access Bedrock directly
    const chatLambda = new NodejsFunction(this, 'ChatHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      entry: path.join(__dirname, '../../../backend/src/chat-lambda.ts'),
      handler: 'handler',
      memorySize: 1024,
      timeout: cdk.Duration.seconds(60), // Longer timeout for Bedrock calls
      environment: {
        VPC_PROXY_FUNCTION_NAME: vpcProxyLambda.functionName,
        // CORS: Allow all origins since we have multiple frontends (localhost, Amplify)
        FRONTEND_URL: '*',
        // Using Amazon Nova Pro for best quality
        // If hitting daily token limits, request quota increase via AWS Support
        // Claude Sonnet 4 requires Anthropic use case form (not yet approved)
        BEDROCK_MODEL_ID: 'amazon.nova-pro-v1:0',
        BEDROCK_REGION: 'us-east-1',
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/client-lambda'],
      },
    });

    // Grant Chat Lambda permission to invoke VPC Proxy Lambda
    vpcProxyLambda.grantInvoke(chatLambda);

    // Suppress cdk-nag warnings for Chat Lambda
    NagSuppressions.addResourceSuppressions(
      chatLambda,
      [
        {
          id: 'AwsSolutions-IAM4',
          reason: 'AWS managed policy (AWSLambdaBasicExecutionRole) is acceptable for Lambda execution role',
          appliesTo: [
            'Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
          ],
        },
        {
          id: 'AwsSolutions-L1',
          reason: 'Using Node.js 20 which is the latest LTS runtime supported by CDK',
        },
      ],
      true // Apply to children (role, etc.)
    );

    // Grant Chat Lambda Bedrock permissions
    chatLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['bedrock:InvokeModel'],
        resources: [
          // Amazon Nova Pro (best quality)
          `arn:aws:bedrock:${this.region}::foundation-model/amazon.nova-pro-v1:0`,
        ],
      })
    );

    // Suppress cdk-nag warnings for Bedrock permissions (wildcard required for model access)
    NagSuppressions.addResourceSuppressions(
      chatLambda,
      [
        {
          id: 'AwsSolutions-IAM5',
          reason: 'Bedrock model access requires specific model ARN pattern',
        },
      ],
      true
    );

    // API Gateway REST API
    this.api = new apigateway.RestApi(this, 'Api', {
      restApiName: 'PrimeDealAuto-Api',
      description: 'Prime Deal Auto REST API',
      deployOptions: {
        stageName: 'v1',
        cachingEnabled: false,
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
    const carsGetMethod = carsResource.addMethod('GET', lambdaIntegration, {
      requestParameters: {
        'method.request.querystring.status': false,
        'method.request.querystring.limit': false,
        'method.request.querystring.offset': false,
        'method.request.querystring.sortBy': false,
        'method.request.querystring.sortOrder': false,
        'method.request.querystring.make': false,
        'method.request.querystring.model': false,
      },
    }); // Public

    // Configure cache keys for GET /cars so status filter is not ignored by cache
    const carsGetMethodCfn = carsGetMethod.node.defaultChild as apigateway.CfnMethod;
    carsGetMethodCfn.addPropertyOverride('Integration.CacheKeyParameters', [
      'method.request.querystring.status',
      'method.request.querystring.limit',
      'method.request.querystring.offset',
      'method.request.querystring.sortBy',
      'method.request.querystring.sortOrder',
      'method.request.querystring.make',
      'method.request.querystring.model',
    ]);
    carsGetMethodCfn.addPropertyOverride('Integration.CacheNamespace', carsResource.resourceId);
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

    // /cars/{carId}/images routes (image management)
    const carImagesResource = carByIdResource.addResource('images');
    carImagesResource.addMethod('POST', lambdaIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    }); // Admin only - save image metadata

    // /cars/{carId}/images/upload-url - get presigned upload URL
    const uploadUrlResource = carImagesResource.addResource('upload-url');
    uploadUrlResource.addMethod('POST', lambdaIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    }); // Admin only

    // /cars/{carId}/images/reorder - reorder images
    const reorderResource = carImagesResource.addResource('reorder');
    reorderResource.addMethod('PUT', lambdaIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    }); // Admin only

    // /cars/{carId}/images/{imageId} routes
    const imageByIdResource = carImagesResource.addResource('{imageId}');
    imageByIdResource.addMethod('DELETE', lambdaIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    }); // Admin only

    // /cars/{carId}/images/{imageId}/primary - set primary image
    const primaryResource = imageByIdResource.addResource('primary');
    primaryResource.addMethod('PUT', lambdaIntegration, {
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

    // Configure cache for GET /search — cache all query params
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

    // POST /search/intent — AI-powered natural language query parsing (public, no caching)
    const intentResource = searchResource.addResource('intent');
    intentResource.addMethod('POST', lambdaIntegration);

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

    // /makes routes (for car make/model/variant dropdowns)
    const makesResource = this.api.root.addResource('makes');
    makesResource.addMethod('GET', lambdaIntegration); // Public - get all makes
    makesResource.addMethod('POST', lambdaIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    }); // Admin only - create make

    // /makes/{makeId}/models routes
    const makeByIdResource = makesResource.addResource('{makeId}');
    const modelsResource = makeByIdResource.addResource('models');
    modelsResource.addMethod('GET', lambdaIntegration); // Public - get models for make
    modelsResource.addMethod('POST', lambdaIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    }); // Admin only - create model

    // /models routes (for variants)
    const modelsRootResource = this.api.root.addResource('models');
    const modelByIdResource = modelsRootResource.addResource('{modelId}');
    const variantsResource = modelByIdResource.addResource('variants');
    variantsResource.addMethod('GET', lambdaIntegration); // Public - get variants for model
    variantsResource.addMethod('POST', lambdaIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    }); // Admin only - create variant

    // /leads routes (contact form)
    const leadsResource = this.api.root.addResource('leads');
    leadsResource.addMethod('POST', lambdaIntegration); // Public - submit lead

    // /analytics routes (event tracking)
    const analyticsResource = this.api.root.addResource('analytics');
    analyticsResource.addMethod('POST', lambdaIntegration); // Public - track events

    // /admin routes
    const adminResource = this.api.root.addResource('admin');
    
    // POST /admin/reindex — bulk reindex all cars (admin only, no caching)
    const reindexResource = adminResource.addResource('reindex');
    reindexResource.addMethod('POST', lambdaIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    }); // Admin group checked in Lambda

    // /admin/{proxy+} — catch-all for admin routes (avoids Lambda policy size limit)
    const adminProxyResource = adminResource.addResource('{proxy+}');
    adminProxyResource.addMethod('ANY', lambdaIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // Chat Lambda integration (separate from main Lambda)
    const chatLambdaIntegration = new apigateway.LambdaIntegration(chatLambda, {
      proxy: true,
    });

    // /chat routes
    const chatResource = this.api.root.addResource('chat');
    
    // POST /chat — send message and get AI response (public, no caching)
    chatResource.addMethod('POST', chatLambdaIntegration);

    // /chat/sessions routes
    const sessionsResource = chatResource.addResource('sessions');
    
    // GET /chat/sessions — list all sessions for authenticated user (requires auth, no caching)
    sessionsResource.addMethod('GET', chatLambdaIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // /chat/sessions/{id} routes
    const sessionByIdResource = sessionsResource.addResource('{id}');
    
    // GET /chat/sessions/{id} — get full session history (public with token or auth, no caching)
    sessionByIdResource.addMethod('GET', chatLambdaIntegration);
    
    // DELETE /chat/sessions/{id} — delete session (requires auth, no caching)
    sessionByIdResource.addMethod('DELETE', chatLambdaIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

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
        ],
        reason: 'S3 bucket permissions use wildcard actions for object operations - required for image upload/download. Bedrock permissions scoped to specific model ARN.',
      },
      {
        id: 'AwsSolutions-L1',
        reason: 'Node.js 20 is the latest LTS runtime supported by Lambda at time of implementation',
      },
    ], true);

    NagSuppressions.addResourceSuppressions(this.lambdaSecurityGroup, [
      {
        id: 'AwsSolutions-EC23',
        reason: 'HTTPS egress to 0.0.0.0/0 required for Secrets Manager VPC endpoint and S3 access',
      },
    ]);
  }
}
