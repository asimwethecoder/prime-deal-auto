import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { NagSuppressions } from 'cdk-nag';
import * as path from 'path';

export interface AuthStackProps extends cdk.StackProps {}

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: AuthStackProps = {}) {
    super(scope, id, props);

    // Post-confirmation Lambda trigger (stub)
    const postConfirmationFn = new NodejsFunction(this, 'PostConfirmationTrigger', {
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      entry: path.join(__dirname, '../lambda/post-confirmation/index.ts'),
      handler: 'handler',
      description: 'Cognito post-confirmation trigger — syncs user to Aurora (stub)',
    });

    // Cognito User Pool
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      signInAliases: { email: true },
      autoVerify: { email: true },
      selfSignUpEnabled: true,
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      advancedSecurityMode: cognito.AdvancedSecurityMode.ENFORCED,
      lambdaTriggers: {
        postConfirmation: postConfirmationFn,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // User Pool Client (SRP auth, no secret)
    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      generateSecret: false,
      authFlows: {
        userSrp: true,
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
    });

    // User groups
    new cognito.CfnUserPoolGroup(this, 'AdminGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'admin',
      description: 'Administrators — full access to admin panel, car CRUD, lead management',
    });

    new cognito.CfnUserPoolGroup(this, 'DealerGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'dealer',
      description: 'Dealers — placeholder for future dealer-specific features',
    });

    new cognito.CfnUserPoolGroup(this, 'UserGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'user',
      description: 'Regular users — favorites, chat, enquiries',
    });

    // CloudFormation outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: `${this.stackName}-UserPoolId`,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: `${this.stackName}-UserPoolClientId`,
    });

    new cdk.CfnOutput(this, 'UserPoolArn', {
      value: this.userPool.userPoolArn,
      description: 'Cognito User Pool ARN',
      exportName: `${this.stackName}-UserPoolArn`,
    });

    // cdk-nag suppressions
    NagSuppressions.addStackSuppressions(this, [
      {
        id: 'AwsSolutions-COG2',
        reason: 'MFA not required for dev environment — deferred to production hardening phase (Spec 14)',
      },
      {
        id: 'AwsSolutions-IAM4',
        reason: 'AWSLambdaBasicExecutionRole managed policy is appropriate for the post-confirmation stub Lambda which only logs events',
      },
      {
        id: 'AwsSolutions-L1',
        reason: 'Node.js 20 is the latest LTS runtime supported by Lambda at time of implementation',
      },
    ]);
  }
}
