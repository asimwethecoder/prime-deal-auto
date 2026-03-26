import { describe, it, expect } from 'vitest';
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
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

  it('creates Secrets Manager secrets (Aurora credentials + SMTP)', () => {
    template.resourceCountIs('AWS::SecretsManager::Secret', 2);
  });

  it('does not create RDS Proxy', () => {
    template.resourceCountIs('AWS::RDS::DBProxy', 0);
  });

  it('creates a VPC endpoint for Secrets Manager', () => {
    template.resourceCountIs('AWS::EC2::VPCEndpoint', 1);
    template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
      VpcEndpointType: 'Interface',
      PrivateDnsEnabled: true,
    });
  });

  it('outputs ClusterEndpoint, SecretArn, VpcId, and DbSecurityGroupId', () => {
    const outputs = template.findOutputs('*');
    const outputKeys = Object.keys(outputs);
    expect(outputKeys.some(k => k.startsWith('ClusterEndpoint'))).toBe(true);
    expect(outputKeys.some(k => k.startsWith('SecretArn'))).toBe(true);
    expect(outputKeys.some(k => k.startsWith('VpcId'))).toBe(true);
    expect(outputKeys.some(k => k.startsWith('DbSecurityGroupId'))).toBe(true);
  });

  it('Property 1: DatabaseStack resource completeness invariant', () => {
    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.resourceCountIs('AWS::RDS::DBCluster', 1);
    template.resourceCountIs('AWS::SecretsManager::Secret', 2);
    template.resourceCountIs('AWS::RDS::DBProxy', 0);
  });

  it('Property 2: CfnOutput completeness invariant', () => {
    const outputs = template.findOutputs('*');
    const outputKeys = Object.keys(outputs);
    expect(outputKeys.some(k => k.startsWith('ClusterEndpoint'))).toBe(true);
    expect(outputKeys.some(k => k.startsWith('SecretArn'))).toBe(true);
    expect(outputKeys.some(k => k.startsWith('VpcId'))).toBe(true);
    expect(outputKeys.some(k => k.startsWith('DbSecurityGroupId'))).toBe(true);
  });
});
