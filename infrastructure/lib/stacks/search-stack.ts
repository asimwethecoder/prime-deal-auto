import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as opensearchserverless from 'aws-cdk-lib/aws-opensearchserverless';
import { Construct } from 'constructs';
import { NagSuppressions } from 'cdk-nag';

export interface SearchStackProps extends cdk.StackProps {
  lambdaExecutionRoleArn: string;
  environment: 'dev' | 'staging' | 'prod';
  vpc: ec2.IVpc;
  lambdaSecurityGroup: ec2.ISecurityGroup;
}

export class SearchStack extends cdk.Stack {
  public readonly collectionEndpoint: string;

  constructor(scope: Construct, id: string, props: SearchStackProps) {
    super(scope, id, props);

    const collectionName = 'primedeals-cars';

    // Create VPC Endpoint for OpenSearch Serverless
    const vpcEndpoint = new opensearchserverless.CfnVpcEndpoint(this, 'VpcEndpoint', {
      name: 'primedeals-search-vpce',
      vpcId: props.vpc.vpcId,
      subnetIds: props.vpc.isolatedSubnets.map(subnet => subnet.subnetId),
      securityGroupIds: [props.lambdaSecurityGroup.securityGroupId],
    });

    // Encryption policy — AWS-managed keys
    const encryptionPolicy = new opensearchserverless.CfnSecurityPolicy(this, 'EncryptionPolicy', {
      name: 'primedeals-search-encryption',
      type: 'encryption',
      policy: JSON.stringify({
        Rules: [
          {
            ResourceType: 'collection',
            Resource: [`collection/${collectionName}`],
          },
        ],
        AWSOwnedKey: true,
      }),
    });

    // Network policy — VPC endpoint access for Lambda, public for dashboard
    // Note: OpenSearch Serverless requires separate rules for public and VPC access
    const networkPolicy = new opensearchserverless.CfnSecurityPolicy(this, 'NetworkPolicy', {
      name: 'primedeals-search-network',
      type: 'network',
      policy: JSON.stringify([
        {
          // Rule 1: VPC endpoint access for Lambda (data operations)
          Rules: [
            {
              ResourceType: 'collection',
              Resource: [`collection/${collectionName}`],
            },
          ],
          AllowFromPublic: false,
          SourceVPCEs: [vpcEndpoint.attrId],
        },
        {
          // Rule 2: Public access for dashboard only
          Rules: [
            {
              ResourceType: 'dashboard',
              Resource: [`collection/${collectionName}`],
            },
          ],
          AllowFromPublic: true,
        },
      ]),
    });

    // Network policy depends on VPC endpoint
    networkPolicy.addDependency(vpcEndpoint);

    // OpenSearch Serverless collection
    const collection = new opensearchserverless.CfnCollection(this, 'SearchCollection', {
      name: collectionName,
      type: 'SEARCH',
      description: 'Search collection for Prime Deal Auto car inventory',
    });

    // Collection depends on policies
    collection.addDependency(encryptionPolicy);
    collection.addDependency(networkPolicy);

    // Data access policy — grant Lambda execution role full permissions
    new opensearchserverless.CfnAccessPolicy(this, 'DataAccessPolicy', {
      name: 'primedeals-search-access',
      type: 'data',
      policy: JSON.stringify([
        {
          Rules: [
            {
              ResourceType: 'collection',
              Resource: [`collection/${collectionName}`],
              Permission: ['aoss:*'],
            },
            {
              ResourceType: 'index',
              Resource: [`index/${collectionName}/*`],
              Permission: ['aoss:*'],
            },
          ],
          Principal: [props.lambdaExecutionRoleArn],
        },
      ]),
    });

    // Store collection endpoint
    this.collectionEndpoint = collection.attrCollectionEndpoint;

    // CloudFormation output
    new cdk.CfnOutput(this, 'CollectionEndpoint', {
      value: this.collectionEndpoint,
      description: 'OpenSearch Serverless collection endpoint',
      exportName: 'SearchCollectionEndpoint',
    });

    new cdk.CfnOutput(this, 'CollectionArn', {
      value: collection.attrArn,
      description: 'OpenSearch Serverless collection ARN',
      exportName: 'SearchCollectionArn',
    });

    new cdk.CfnOutput(this, 'VpcEndpointId', {
      value: vpcEndpoint.attrId,
      description: 'OpenSearch Serverless VPC endpoint ID',
      exportName: 'SearchVpcEndpointId',
    });

    // cdk-nag suppressions with documented justifications
    NagSuppressions.addResourceSuppressions(
      networkPolicy,
      [
        {
          id: 'AwsSolutions-OS5',
          reason: 'Public access enabled for OpenSearch dashboard access - Lambda uses VPC endpoint for data operations',
        },
      ],
      true
    );
  }
}
