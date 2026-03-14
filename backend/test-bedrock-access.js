/**
 * Test script to verify Bedrock model access
 * Tests if we can access anthropic.claude-sonnet-4-20250514-v1:0
 */

const { BedrockRuntimeClient, ConverseCommand } = require('@aws-sdk/client-bedrock-runtime');

async function testBedrockAccess() {
  console.log('Testing Bedrock model access...\n');
  
  const client = new BedrockRuntimeClient({
    region: 'us-east-1',
  });

  // Try inference profile first (new Bedrock requirement)
  const inferenceProfileId = 'us.anthropic.claude-sonnet-4-20250514-v1:0';
  const modelId = 'anthropic.claude-sonnet-4-20250514-v1:0';
  
  console.log(`Inference Profile: ${inferenceProfileId}`);
  console.log(`Model ID: ${modelId}`);
  console.log(`Region: us-east-1`);
  console.log(`Account: 141814481613\n`);

  try {
    // First try with inference profile
    const command = new ConverseCommand({
      modelId: inferenceProfileId,
      messages: [
        {
          role: 'user',
          content: [{ text: 'Hello! Please respond with just "Access confirmed"' }],
        },
      ],
      inferenceConfig: {
        maxTokens: 50,
        temperature: 0.7,
      },
    });

    console.log('Sending test request to Bedrock...\n');
    const response = await client.send(command);

    console.log('✅ SUCCESS! Bedrock access is working!\n');
    console.log('Response details:');
    console.log('- Stop reason:', response.stopReason);
    console.log('- Input tokens:', response.usage?.inputTokens);
    console.log('- Output tokens:', response.usage?.outputTokens);
    console.log('\nAssistant response:');
    console.log(response.output?.message?.content?.[0]?.text || 'No text response');
    
    return true;
  } catch (error) {
    console.log('❌ FAILED! Bedrock access is blocked.\n');
    console.log('Error details:');
    console.log('- Error name:', error.name);
    console.log('- Error message:', error.message);
    
    if (error.name === 'ValidationException' && error.message.includes('not allowed')) {
      console.log('\n⚠️  Model access not granted yet.');
      console.log('\nNext steps:');
      console.log('1. Log into AWS Console as root user');
      console.log('2. Navigate to: https://console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess');
      console.log('3. Click "Manage model access"');
      console.log('4. Find "Anthropic" and check "Claude Sonnet 4"');
      console.log('5. Submit the request with use case description');
      console.log('\nUse case description:');
      console.log('---');
      console.log('AI-powered sales assistant for Prime Deal Auto, an automotive dealership');
      console.log('in South Africa. The assistant helps customers discover vehicles, answers');
      console.log('questions about inventory, provides recommendations, and captures leads.');
      console.log('Deployed via AWS Lambda using Bedrock Converse API with tool-based');
      console.log('architecture for real-time inventory queries. Expected volume:');
      console.log('100-5,000 conversations/month. Claude Sonnet 4 selected for superior');
      console.log('reasoning and multi-turn conversation capabilities essential for');
      console.log('automotive sales.');
      console.log('---');
    }
    
    return false;
  }
}

// Run the test
testBedrockAccess()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
