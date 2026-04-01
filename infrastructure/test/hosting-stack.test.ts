import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { HostingStack } from '../lib/stacks/hosting-stack';

describe('HostingStack', () => {
  let app: cdk.App;
  let stack: HostingStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new HostingStack(app, 'TestHostingStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      apiUrl: 'https://test-api.execute-api.us-east-1.amazonaws.com/v1/',
    });
    template = Template.fromStack(stack);
  });

  test('creates Amplify App with correct configuration', () => {
    template.hasResourceProperties('AWS::Amplify::App', {
      Name: 'prime-deal-auto-frontend',
      Platform: 'WEB_COMPUTE',
    });
  });

  test('sets NEXT_PUBLIC_API_URL environment variable', () => {
    template.hasResourceProperties('AWS::Amplify::App', {
      EnvironmentVariables: [
        {
          Name: 'NEXT_PUBLIC_API_URL',
          Value: 'https://test-api.execute-api.us-east-1.amazonaws.com/v1/',
        },
        {
          Name: '_LIVE_UPDATES',
        },
      ],
    });
  });

  test('creates main branch with correct settings', () => {
    template.hasResourceProperties('AWS::Amplify::Branch', {
      BranchName: 'main',
      EnableAutoBuild: true,
      Framework: 'Next.js - SSR',
      Stage: 'PRODUCTION',
    });
  });

  test('creates IAM service role for Amplify', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Principal: {
              Service: 'amplify.amazonaws.com',
            },
          }),
        ]),
      },
    });
  });

  test('grants CloudWatch Logs permissions to Amplify role', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
          },
        ],
      },
    });
  });

  test('exports Amplify App ID', () => {
    template.hasOutput('AmplifyAppId', {
      Export: {
        Name: 'PrimeDeals-AmplifyAppId',
      },
    });
  });

  test('exports Amplify App URL', () => {
    template.hasOutput('AmplifyAppUrl', {
      Export: {
        Name: 'PrimeDeals-AmplifyAppUrl',
      },
    });
  });

  test('has build spec configured', () => {
    template.hasResourceProperties('AWS::Amplify::App', {
      BuildSpec: {
        'Fn::Sub': Match.stringLikeRegexp('npm run build'),
      },
    });
  });
});
