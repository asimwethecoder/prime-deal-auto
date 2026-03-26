import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { NagSuppressions } from 'cdk-nag';
import * as path from 'path';
import { afterBundlingCopyRdsCaBundle } from '../bundle-rds-ca';

export interface MigrationStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  auroraClusterEndpoint: string;
  dbSecurityGroupId: string;
  dbSecret: secretsmanager.ISecret;
}

export class MigrationStack extends cdk.Stack {
  public readonly migrationFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: MigrationStackProps) {
    super(scope, id, props);

    const lambdaSecurityGroup = new ec2.SecurityGroup(this, 'MigrationLambdaSG', {
      vpc: props.vpc,
      description: 'Security group for migration Lambda',
      allowAllOutbound: false,
    });

    lambdaSecurityGroup.addEgressRule(
      ec2.Peer.securityGroupId(props.dbSecurityGroupId),
      ec2.Port.tcp(5432),
      'Allow outbound to Aurora'
    );

    lambdaSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound for Secrets Manager'
    );

    const allowMigrationToAurora = new ec2.CfnSecurityGroupIngress(this, 'AllowMigrationLambdaToAurora', {
      groupId: props.dbSecurityGroupId,
      sourceSecurityGroupId: lambdaSecurityGroup.securityGroupId,
      ipProtocol: 'tcp',
      fromPort: 5432,
      toPort: 5432,
      description: 'Allow migration Lambda to connect to Aurora',
    });
    NagSuppressions.addResourceSuppressions(allowMigrationToAurora, [
      {
        id: 'AwsSolutions-EC23',
        reason: 'Ingress is scoped to the migration Lambda security group only, not open to the internet',
      },
    ]);

    this.migrationFunction = new NodejsFunction(this, 'MigrationHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      entry: path.join(__dirname, '../../../backend/scripts/migration-lambda.js'),
      handler: 'handler',
      memorySize: 512,
      timeout: cdk.Duration.minutes(5),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [lambdaSecurityGroup],
      environment: {
        DB_HOST: props.auroraClusterEndpoint,
        DB_NAME: 'primedealauto',
        SECRET_ARN: props.dbSecret.secretArn,
      },
      bundling: {
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

    props.dbSecret.grantRead(this.migrationFunction);

    new cdk.CfnOutput(this, 'MigrationFunctionName', {
      value: this.migrationFunction.functionName,
      description: 'Migration Lambda function name',
    });

    new cdk.CfnOutput(this, 'MigrationFunctionArn', {
      value: this.migrationFunction.functionArn,
      description: 'Migration Lambda function ARN',
    });

    NagSuppressions.addResourceSuppressions(this.migrationFunction, [
      {
        id: 'AwsSolutions-IAM4',
        reason: 'AWSLambdaBasicExecutionRole and AWSLambdaVPCAccessExecutionRole managed policies required for VPC-attached Lambda',
      },
      {
        id: 'AwsSolutions-L1',
        reason: 'Node.js 20 is the latest LTS runtime supported by Lambda at time of implementation',
      },
    ], true);

    NagSuppressions.addResourceSuppressions(lambdaSecurityGroup, [
      {
        id: 'AwsSolutions-EC23',
        reason: 'HTTPS egress to 0.0.0.0/0 required for Secrets Manager VPC endpoint access',
      },
    ]);
  }
}
