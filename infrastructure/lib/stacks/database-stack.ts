import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { NagSuppressions } from 'cdk-nag';

export interface DatabaseStackProps extends cdk.StackProps {}

export class DatabaseStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly cluster: rds.DatabaseCluster;
  public readonly clusterEndpoint: string;
  public readonly secret: secretsmanager.ISecret;
  public readonly dbSecurityGroup: ec2.SecurityGroup;
  public readonly smtpSecret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props: DatabaseStackProps = {}) {
    super(scope, id, props);

    // VPC: 2 AZs (Aurora requires subnets in ≥2 AZs), private isolated subnets only, no NAT Gateway
    // Single writer instance — the second subnet is only for Aurora subnet group requirement, not for a replica
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // VPC Endpoint for Secrets Manager — allows Lambda to fetch DB credentials without NAT
    this.vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });

    // Inbound 5432 from Lambda/Migration is added in ApiStack / MigrationStack via CfnSecurityGroupIngress.
    // Keep GroupDescription byte-identical to the deployed stack to avoid SG replacement (export DbSecurityGroupId must stay stable).
    this.dbSecurityGroup = new ec2.SecurityGroup(this, 'AuroraSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Aurora PostgreSQL cluster - allows port 5432 from RDS Proxy only',
      allowAllOutbound: false,
    });

    // Aurora Serverless v2 cluster — single writer, PostgreSQL 15
    this.cluster = new rds.DatabaseCluster(this, 'AuroraCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_15,
      }),
      credentials: rds.Credentials.fromGeneratedSecret('postgres'),
      defaultDatabaseName: 'primedealauto',
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 4,
      writer: rds.ClusterInstance.serverlessV2('writer'),
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [this.dbSecurityGroup],
      storageEncrypted: true,
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      enableDataApi: true,
    });

    // Expose the generated secret
    this.secret = this.cluster.secret!;

    this.clusterEndpoint = this.cluster.clusterEndpoint.hostname;

    // SMTP Secret for email notifications
    // Stores credentials for mail.primedealauto.co.za SMTP server
    // The secret value should be set manually in AWS Console after deployment:
    // { "host": "mail.primedealauto.co.za", "port": 465, "username": "sales@primedealauto.co.za", "password": "..." }
    this.smtpSecret = new secretsmanager.Secret(this, 'SmtpSecret', {
      secretName: 'primedealauto/smtp',
      description: 'SMTP credentials for Prime Deal Auto email notifications',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          host: 'mail.primedealauto.co.za',
          port: 465,
          username: 'sales@primedealauto.co.za',
        }),
        generateStringKey: 'password',
        excludePunctuation: false,
        passwordLength: 32,
      },
    });

    // CloudFormation outputs
    new cdk.CfnOutput(this, 'ClusterEndpoint', {
      value: this.cluster.clusterEndpoint.hostname,
      description: 'Aurora cluster writer endpoint',
      exportName: `${this.stackName}-ClusterEndpoint`,
    });

    new cdk.CfnOutput(this, 'SecretArn', {
      value: this.secret.secretArn,
      description: 'Secrets Manager secret ARN for Aurora credentials',
      exportName: `${this.stackName}-SecretArn`,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `${this.stackName}-VpcId`,
    });

    new cdk.CfnOutput(this, 'DbSecurityGroupId', {
      value: this.dbSecurityGroup.securityGroupId,
      description: 'Aurora DB security group ID (used for Lambda direct connectivity)',
      exportName: `${this.stackName}-DbSecurityGroupId`,
    });

    new cdk.CfnOutput(this, 'SmtpSecretArn', {
      value: this.smtpSecret.secretArn,
      description: 'Secrets Manager secret ARN for SMTP credentials',
      exportName: `${this.stackName}-SmtpSecretArn`,
    });

    // Legacy export: keep Aurora SG output so CloudFormation does not delete the export if anything still imports it.
    new cdk.CfnOutput(this, 'ExportsOutputFnGetAttAuroraSecurityGroup75F699F6GroupId12D936A9', {
      value: this.dbSecurityGroup.securityGroupId,
      description: 'Aurora SG ID (legacy)',
      exportName: 'PrimeDeals-Database:ExportsOutputFnGetAttAuroraSecurityGroup75F699F6GroupId12D936A9',
    });

    // cdk-nag suppressions
    NagSuppressions.addStackSuppressions(this, [
      {
        id: 'AwsSolutions-VPC7',
        reason: 'VPC Flow Logs deferred to MonitoringStack (Spec 12) to keep this stack focused',
      },
      {
        id: 'AwsSolutions-RDS6',
        reason: 'IAM database auth not enabled — using Secrets Manager credentials with TLS from application',
      },
      {
        id: 'AwsSolutions-RDS10',
        reason: 'Deletion protection disabled for dev environment — must be enabled before production deployment',
      },
      {
        id: 'AwsSolutions-RDS14',
        reason: 'Aurora backtrack is not supported on Aurora PostgreSQL, only Aurora MySQL',
      },
      {
        id: 'AwsSolutions-SMG4',
        reason: 'Secret rotation deferred to production hardening phase (Spec 14)',
      },
      {
        id: 'CdkNagValidationFailure',
        reason: 'AwsSolutions-EC23 cannot resolve VPC CIDR intrinsic function — VPC endpoint SG is scoped to VPC CIDR which is secure',
      },
    ]);
  }
}
