/**
 * Test script to verify Amazon Nova Pro access and tool use
 */

const { BedrockRuntimeClient, ConverseCommand } = require('@aws-sdk/client-bedrock-runtime');

async function testNovaProAccess() {
  console.log('Testing Amazon Nova Pro access...\n');
  
  const client = new BedrockRuntimeClient({
    region: 'us-east-1',
  });

  const modelId = 'amazon.nova-pro-v1:0';
  
  console.log(`Model ID: ${modelId}`);
  console.log(`Region: us-east-1`);
  console.log(`Account: 141814481613\n`);

  // Test 1: Basic conversation
  console.log('Test 1: Basic conversation...');
  try {
    const command = new ConverseCommand({
      modelId,
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

    const response = await client.send(command);
    console.log('✅ Basic conversation works!');
    console.log('Response:', response.output?.message?.content?.[0]?.text || 'No text response');
    console.log('');
  } catch (error) {
    console.log('❌ Basic conversation failed:', error.message);
    return false;
  }

  // Test 2: Tool use (function calling)
  console.log('Test 2: Tool use (function calling)...');
  try {
    const toolCommand = new ConverseCommand({
      modelId,
      messages: [
        {
          role: 'user',
          content: [{ text: 'Search for Toyota cars under R300000' }],
        },
      ],
      toolConfig: {
        tools: [
          {
            toolSpec: {
              name: 'search_cars',
              description: 'Search for cars by make and price',
              inputSchema: {
                json: {
                  type: 'object',
                  properties: {
                    make: { type: 'string' },
                    maxPrice: { type: 'number' },
                  },
                },
              },
            },
          },
        ],
      },
      inferenceConfig: {
        maxTokens: 500,
        temperature: 0.7,
      },
    });

    const toolResponse = await client.send(toolCommand);
    
    if (toolResponse.stopReason === 'tool_use') {
      console.log('✅ Tool use works!');
      const toolUse = toolResponse.output?.message?.content?.find(c => c.toolUse);
      if (toolUse) {
        console.log('Tool called:', toolUse.toolUse.name);
        console.log('Tool input:', JSON.stringify(toolUse.toolUse.input, null, 2));
      }
    } else {
      console.log('⚠️  Model responded without using tool (stopReason:', toolResponse.stopReason + ')');
      console.log('Response:', toolResponse.output?.message?.content?.[0]?.text);
    }
    console.log('');
  } catch (error) {
    console.log('❌ Tool use failed:', error.message);
    return false;
  }

  console.log('✅ All tests passed! Amazon Nova Pro is ready to use.');
  return true;
}

// Run the test
testNovaProAccess()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
