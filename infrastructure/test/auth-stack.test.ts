import { describe, it, expect } from 'vitest';
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { AuthStack } from '../lib/stacks/auth-stack';

describe('AuthStack', () => {
  const app = new cdk.App();
  const stack = new AuthStack(app, 'TestAuthStack');
  const template = Template.fromStack(stack);

  it('creates a Cognito User Pool with email sign-in and auto-verify', () => {
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      UsernameAttributes: ['email'],
      AutoVerifiedAttributes: ['email'],
      AdminCreateUserConfig: {
        AllowAdminCreateUserOnly: false,
      },
    });
  });

  it('configures password policy correctly', () => {
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      Policies: {
        PasswordPolicy: {
          MinimumLength: 8,
          RequireUppercase: true,
          RequireLowercase: true,
          RequireNumbers: true,
          RequireSymbols: true,
        },
      },
    });
  });

  it('configures account recovery via email', () => {
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      AccountRecoverySetting: {
        RecoveryMechanisms: Match.arrayWith([
          Match.objectLike({ Name: 'verified_email' }),
        ]),
      },
    });
  });

  it('creates a User Pool Client with SRP auth and no secret', () => {
    template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
      ExplicitAuthFlows: Match.arrayWith(['ALLOW_USER_SRP_AUTH', 'ALLOW_REFRESH_TOKEN_AUTH']),
      // CDK explicitly sets GenerateSecret: false when generateSecret: false is configured
      GenerateSecret: false,
    });
  });

  it('creates exactly 3 user groups: admin, dealer, user', () => {
    template.resourceCountIs('AWS::Cognito::UserPoolGroup', 3);
    template.hasResourceProperties('AWS::Cognito::UserPoolGroup', { GroupName: 'admin' });
    template.hasResourceProperties('AWS::Cognito::UserPoolGroup', { GroupName: 'dealer' });
    template.hasResourceProperties('AWS::Cognito::UserPoolGroup', { GroupName: 'user' });
  });

  it('creates a Lambda function with Node.js 20 runtime and ARM64 architecture', () => {
    template.resourceCountIs('AWS::Lambda::Function', 1);
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs20.x',
      Architectures: ['arm64'],
    });
  });

  it('enables advanced security mode (ENFORCED)', () => {
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      UserPoolAddOns: {
        AdvancedSecurityMode: 'ENFORCED',
      },
    });
  });

  it('attaches post-confirmation Lambda trigger to User Pool', () => {
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      LambdaConfig: {
        PostConfirmation: Match.anyValue(),
      },
    });
  });

  it('outputs UserPoolId, UserPoolClientId, and UserPoolArn', () => {
    const outputs = template.findOutputs('*');
    const outputKeys = Object.keys(outputs);
    expect(outputKeys.some(k => k.startsWith('UserPoolId'))).toBe(true);
    expect(outputKeys.some(k => k.startsWith('UserPoolClientId'))).toBe(true);
    expect(outputKeys.some(k => k.startsWith('UserPoolArn'))).toBe(true);
  });

  it('Property 1: AuthStack resource completeness invariant', () => {
    // Validates: Requirements 1.1, 2.1, 3.1-3.3, 4.1
    template.resourceCountIs('AWS::Cognito::UserPool', 1);
    template.resourceCountIs('AWS::Cognito::UserPoolClient', 1);
    template.resourceCountIs('AWS::Cognito::UserPoolGroup', 3);
    template.resourceCountIs('AWS::Lambda::Function', 1);
  });

  it('Property 2: CfnOutput completeness invariant', () => {
    // Validates: Requirements 5.3, 5.4, 5.5
    const outputs = template.findOutputs('*');
    const outputKeys = Object.keys(outputs);
    expect(outputKeys.some(k => k.startsWith('UserPoolId'))).toBe(true);
    expect(outputKeys.some(k => k.startsWith('UserPoolClientId'))).toBe(true);
    expect(outputKeys.some(k => k.startsWith('UserPoolArn'))).toBe(true);
  });
});
