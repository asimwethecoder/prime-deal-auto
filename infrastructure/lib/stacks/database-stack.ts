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
  public readonly secret: secretsmanager.ISecret;
  public readonly proxy: rds.DatabaseProxy;
  public readonly dbSecurityGroup: ec2.SecurityGroup;
  public readonly proxySecurityGroup: ec2.SecurityGroup;

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

    // Security group for Aurora cluster
    this.dbSecurityGroup = new ec2.SecurityGroup(this, 'AuroraSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Aurora PostgreSQL cluster - allows port 5432 from RDS Proxy only',
      allowAllOutbound: false,
    });

    // Security group for RDS Proxy (exported for Lambda to use)
    this.proxySecurityGroup = new ec2.SecurityGroup(this, 'ProxySecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for RDS Proxy - allows port 5432 inbound from Lambda',
      allowAllOutbound: false,
    });

    // Aurora SG: allow inbound 5432 from RDS Proxy SG only
    this.dbSecurityGroup.addIngressRule(
      this.proxySecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from RDS Proxy',
    );

    // Proxy SG: allow outbound to Aurora SG on 5432
    this.proxySecurityGroup.addEgressRule(
      this.dbSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow outbound to Aurora',
    );

    // Inbound from Lambda is added in ApiStack via CfnSecurityGroupIngress to avoid circular dependency.

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

    // RDS Proxy — connection pooling for Lambda functions
    this.proxy = new rds.DatabaseProxy(this, 'RdsProxy', {
      proxyTarget: rds.ProxyTarget.fromCluster(this.cluster),
      secrets: [this.secret],
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [this.proxySecurityGroup],
      requireTLS: true,
      iamAuth: false,
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

    new cdk.CfnOutput(this, 'RdsProxyEndpoint', {
      value: this.proxy.endpoint,
      description: 'RDS Proxy endpoint — use as DB_HOST in Lambda',
      exportName: `${this.stackName}-RdsProxyEndpoint`,
    });

    new cdk.CfnOutput(this, 'ProxySecurityGroupId', {
      value: this.proxySecurityGroup.securityGroupId,
      description: 'RDS Proxy security group ID',
      exportName: `${this.stackName}-ProxySecurityGroupId`,
    });

    // Legacy export: keep Aurora SG output so CloudFormation does not delete the export (ApiStack still imports it).
    // Use the same logical ID as the currently deployed stack so this is an in-place update, not delete+add.
    // Remove this output after Phase 2 (ApiStack deploy), then deploy DatabaseStack again (Phase 3).
    new cdk.CfnOutput(this, 'ExportsOutputFnGetAttAuroraSecurityGroup75F699F6GroupId12D936A9', {
      value: this.dbSecurityGroup.securityGroupId,
      description: 'Aurora SG ID (legacy; remove after ApiStack migration)',
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
        reason: 'IAM auth not enabled — using Secrets Manager credentials via RDS Proxy which is simpler and sufficient for this architecture',
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
