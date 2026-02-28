import { describe, it, expect } from 'vitest';
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { DatabaseStack } from '../lib/stacks/database-stack';

describe('DatabaseStack', () => {
  const app = new cdk.App();
  const stack = new DatabaseStack(app, 'TestDatabaseStack');
  const template = Template.fromStack(stack);

  it('creates a VPC resource', () => {
    template.resourceCountIs('AWS::EC2::VPC', 1);
  });

  it('creates an Aurora DB cluster with PostgreSQL engine', () => {
    template.hasResourceProperties('AWS::RDS::DBCluster', {
      Engine: 'aurora-postgresql',
    });
  });

  it('Aurora cluster has Serverless v2 scaling config (0.5 min, 4 max ACU)', () => {
    template.hasResourceProperties('AWS::RDS::DBCluster', {
      ServerlessV2ScalingConfiguration: {
        MinCapacity: 0.5,
        MaxCapacity: 4,
      },
    });
  });

  it('Aurora cluster has defaultDatabaseName: primedealauto', () => {
    template.hasResourceProperties('AWS::RDS::DBCluster', {
      DatabaseName: 'primedealauto',
    });
  });

  it('Aurora cluster has storage encryption enabled', () => {
    template.hasResourceProperties('AWS::RDS::DBCluster', {
      StorageEncrypted: true,
    });
  });

  it('Aurora cluster has deletion protection disabled', () => {
    template.hasResourceProperties('AWS::RDS::DBCluster', {
      DeletionProtection: false,
    });
  });

  it('creates a DB writer instance (serverlessV2)', () => {
    template.resourceCountIs('AWS::RDS::DBInstance', 1);
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      DBInstanceClass: 'db.serverless',
    });
  });

  it('creates a Secrets Manager secret', () => {
    template.resourceCountIs('AWS::SecretsManager::Secret', 1);
  });

  it('creates security groups with port 5432 ingress rules', () => {
    // CDK renders addIngressRule() calls as standalone AWS::EC2::SecurityGroupIngress resources
    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      FromPort: 5432,
      ToPort: 5432,
      IpProtocol: 'tcp',
    });
  });

  it('creates an RDS Proxy with TLS required and IAM auth disabled', () => {
    template.resourceCountIs('AWS::RDS::DBProxy', 1);
    template.hasResourceProperties('AWS::RDS::DBProxy', {
      RequireTLS: true,
      Auth: Match.arrayWith([
        Match.objectLike({
          IAMAuth: 'DISABLED',
        }),
      ]),
    });
  });

  it('creates a VPC endpoint for Secrets Manager', () => {
    template.resourceCountIs('AWS::EC2::VPCEndpoint', 1);
    // ServiceName is a Fn::Join token — verify it's an Interface endpoint in the VPC
    template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
      VpcEndpointType: 'Interface',
      PrivateDnsEnabled: true,
    });
  });

  it('outputs ClusterEndpoint, SecretArn, VpcId, and RdsProxyEndpoint', () => {
    const outputs = template.findOutputs('*');
    const outputKeys = Object.keys(outputs);
    expect(outputKeys.some(k => k.startsWith('ClusterEndpoint'))).toBe(true);
    expect(outputKeys.some(k => k.startsWith('SecretArn'))).toBe(true);
    expect(outputKeys.some(k => k.startsWith('VpcId'))).toBe(true);
    expect(outputKeys.some(k => k.startsWith('RdsProxyEndpoint'))).toBe(true);
  });

  it('Property 1: DatabaseStack resource completeness invariant', () => {
    // Validates: Requirements 6.1, 7.1, 8.1, 10.1, 14.5-14.9
    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.resourceCountIs('AWS::RDS::DBCluster', 1);
    template.resourceCountIs('AWS::SecretsManager::Secret', 1);
    template.resourceCountIs('AWS::RDS::DBProxy', 1);
  });

  it('Property 2: CfnOutput completeness invariant', () => {
    // Validates: Requirements 11.6, 11.7, 11.8, 11.9
    const outputs = template.findOutputs('*');
    const outputKeys = Object.keys(outputs);
    expect(outputKeys.some(k => k.startsWith('ClusterEndpoint'))).toBe(true);
    expect(outputKeys.some(k => k.startsWith('SecretArn'))).toBe(true);
    expect(outputKeys.some(k => k.startsWith('VpcId'))).toBe(true);
    expect(outputKeys.some(k => k.startsWith('RdsProxyEndpoint'))).toBe(true);
  });
});
