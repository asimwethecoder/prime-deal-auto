/**
 * Script to trigger OpenSearch reindex by invoking the Lambda directly
 * This bypasses API Gateway authentication for initial setup
 * 
 * Usage: node scripts/trigger-reindex.js
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

async function triggerReindex() {
  const client = new LambdaClient({ 
    region: 'us-east-1',
    // Uses AWS credentials from environment or ~/.aws/credentials
  });

  // Simulate an API Gateway event for POST /admin/reindex
  // with mock admin claims to bypass auth check
  const event = {
    httpMethod: 'POST',
    path: '/admin/reindex',
    headers: {},
    queryStringParameters: null,
    body: null,
    requestContext: {
      authorizer: {
        claims: {
          sub: 'admin-script',
          'cognito:groups': 'admin'
        }
      }
    }
  };

  const command = new InvokeCommand({
    FunctionName: 'PrimeDeals-Api-ApiHandler5E7490E8-SALUIekEIzWN',
    Payload: JSON.stringify(event)
  });

  console.log('Invoking Lambda to trigger reindex...');
  
  try {
    const response = await client.send(command);
    const payload = JSON.parse(Buffer.from(response.Payload).toString());
    
    console.log('Response status:', response.StatusCode);
    console.log('Response payload:', JSON.stringify(payload, null, 2));
    
    if (payload.statusCode === 200) {
      const body = JSON.parse(payload.body);
      console.log('\n✅ Reindex successful!');
      console.log('Indexed cars:', body.data?.indexed);
    } else {
      console.log('\n❌ Reindex failed');
      console.log('Error:', payload.body);
    }
  } catch (error) {
    console.error('Error invoking Lambda:', error.message);
  }
}

triggerReindex();
