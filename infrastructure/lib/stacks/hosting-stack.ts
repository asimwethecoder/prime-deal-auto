import * as cdk from 'aws-cdk-lib';
import * as amplify from 'aws-cdk-lib/aws-amplify';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { NagSuppressions } from 'cdk-nag';

export interface HostingStackProps extends cdk.StackProps {
  // API URL from ApiStack
  apiUrl: string;
  
  // Optional: GitHub repository details for automatic deployments
  githubRepository?: string;
  githubBranch?: string;
  githubToken?: string;
}

export class HostingStack extends cdk.Stack {
  public readonly amplifyApp: amplify.CfnApp;

  constructor(scope: Construct, id: string, props: HostingStackProps) {
    super(scope, id, props);

    // Create Amplify App
    this.amplifyApp = new amplify.CfnApp(this, 'PrimeDealAutoApp', {
      name: 'prime-deal-auto-frontend',
      description: 'Prime Deal Auto - Next.js 15 Frontend',
      platform: 'WEB_COMPUTE', // Required for Next.js SSR
      
      // Environment variables for the frontend
      environmentVariables: [
        {
          name: 'NEXT_PUBLIC_API_URL',
          value: props.apiUrl,
        },
        {
          name: '_LIVE_UPDATES',
          value: JSON.stringify([
            {
              pkg: 'next',
              type: 'internal',
              version: 'latest',
            },
          ]),
        },
      ],

      // Build settings for Next.js 15
      buildSpec: cdk.Fn.sub(`version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/.next
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
      - frontend/.next/cache/**/*`),

      // Custom rules for Next.js routing
      customRules: [
        {
          source: '/<*>',
          target: '/index.html',
          status: '404-200',
        },
      ],

      // IAM service role for Amplify
      iamServiceRole: this.createAmplifyServiceRole().roleArn,
    });

    // Add branch (main) for deployment
    const mainBranch = new amplify.CfnBranch(this, 'MainBranch', {
      appId: this.amplifyApp.attrAppId,
      branchName: props.githubBranch || 'main',
      enableAutoBuild: true,
      enablePullRequestPreview: false,
      framework: 'Next.js - SSR',
      stage: 'PRODUCTION',
    });

    // CloudFormation outputs
    new cdk.CfnOutput(this, 'AmplifyAppId', {
      value: this.amplifyApp.attrAppId,
      description: 'Amplify App ID',
      exportName: 'PrimeDeals-AmplifyAppId',
    });

    new cdk.CfnOutput(this, 'AmplifyAppUrl', {
      value: `https://${mainBranch.branchName}.${this.amplifyApp.attrDefaultDomain}`,
      description: 'Amplify App URL',
      exportName: 'PrimeDeals-AmplifyAppUrl',
    });

    new cdk.CfnOutput(this, 'AmplifyConsoleUrl', {
      value: `https://console.aws.amazon.com/amplify/home?region=${this.region}#/${this.amplifyApp.attrAppId}`,
      description: 'Amplify Console URL',
    });

    // cdk-nag suppressions
    this.addNagSuppressions();
  }

  private createAmplifyServiceRole(): iam.Role {
    const role = new iam.Role(this, 'AmplifyServiceRole', {
      assumedBy: new iam.ServicePrincipal('amplify.amazonaws.com'),
      description: 'Service role for Amplify to access AWS resources',
    });

    // Allow Amplify to access CloudWatch Logs
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: [
          `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/amplify/*`,
        ],
      })
    );

    return role;
  }

  private addNagSuppressions(): void {
    // Suppress warnings for Amplify service role
    NagSuppressions.addResourceSuppressions(
      this,
      [
        {
          id: 'AwsSolutions-IAM5',
          reason: 'Amplify service role requires wildcard permissions for CloudWatch Logs',
        },
      ],
      true
    );
  }
}
