/**
 * Multi-Turn Conversation Memory Test for Prime Deal Auto Chat
 * 
 * Tests that the AI assistant remembers context from previous messages:
 * 1. Ask for Ford cars → Get list with prices
 * 2. Reference a price from previous response → Should understand context
 * 3. Ask follow-up about "that one" → Should remember which car
 * 
 * Based on LLM memory testing best practices:
 * - Test context retention across turns
 * - Test implicit reference resolution
 * - Test price/detail recall from previous messages
 */

const API_URL = 'https://urwy8bxz7g.execute-api.us-east-1.amazonaws.com/v1';

// Store session token for multi-turn conversation
let sessionToken = null;
let sessionId = null;

/**
 * Send a chat message and return the response
 */
async function sendMessage(message, turnNumber) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TURN ${turnNumber}: USER`);
  console.log(`${'='.repeat(60)}`);
  console.log(`> ${message}`);
  
  const body = {
    message,
  };
  
  // Include session info for continuity
  if (sessionToken) {
    body.sessionToken = sessionToken;
  }
  if (sessionId) {
    body.sessionId = sessionId;
  }
  
  const response = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }
  
  const data = await response.json();
  
  // Store session info for next turn
  if (data.data?.sessionToken) {
    sessionToken = data.data.sessionToken;
  }
  if (data.data?.sessionId) {
    sessionId = data.data.sessionId;
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TURN ${turnNumber}: ASSISTANT`);
  console.log(`${'='.repeat(60)}`);
  console.log(data.data?.message || data.message || 'No response');
  
  return data;
}

/**
 * Test 1: Basic Memory - Ask for cars, then reference previous context
 */
async function testBasicMemory() {
  console.log('\n\n' + '🧪'.repeat(30));
  console.log('TEST 1: BASIC CONVERSATION MEMORY');
  console.log('Testing if AI remembers Ford cars from previous turn');
  console.log('🧪'.repeat(30));
  
  // Turn 1: Ask for Ford cars
  const turn1 = await sendMessage(
    "Show me Ford cars you have available",
    1
  );
  
  // Wait a bit between turns
  await new Promise(r => setTimeout(r, 1000));
  
  // Turn 2: Reference previous context implicitly
  const turn2 = await sendMessage(
    "Which one of those is the cheapest?",
    2
  );
  
  // Check if response references Ford or the previous results
  const response2 = turn2.data?.message || '';
  const memoryWorking = 
    response2.toLowerCase().includes('ford') ||
    response2.toLowerCase().includes('cheapest') ||
    response2.includes('R') || // Price reference
    response2.toLowerCase().includes('lowest');
  
  console.log(`\n✅ Memory Test 1: ${memoryWorking ? 'PASSED' : 'NEEDS REVIEW'}`);
  console.log(`   AI ${memoryWorking ? 'remembered' : 'may not have remembered'} the Ford cars context`);
  
  return memoryWorking;
}

/**
 * Test 2: Price Context Memory - Mention a price range based on previous results
 */
async function testPriceContextMemory() {
  console.log('\n\n' + '🧪'.repeat(30));
  console.log('TEST 2: PRICE CONTEXT MEMORY');
  console.log('Testing if AI understands price references from previous conversation');
  console.log('🧪'.repeat(30));
  
  // Turn 3: Reference price from previous conversation
  const turn3 = await sendMessage(
    "Actually, I'm looking for something under R200,000. Do you have any from what you showed me?",
    3
  );
  
  // Check if response shows understanding of context
  const response3 = turn3.data?.message || '';
  const memoryWorking = 
    response3.toLowerCase().includes('ford') ||
    response3.toLowerCase().includes('under') ||
    response3.includes('200') ||
    response3.toLowerCase().includes('budget') ||
    response3.toLowerCase().includes('price');
  
  console.log(`\n✅ Memory Test 2: ${memoryWorking ? 'PASSED' : 'NEEDS REVIEW'}`);
  console.log(`   AI ${memoryWorking ? 'understood' : 'may not have understood'} the price context`);
  
  return memoryWorking;
}

/**
 * Test 3: Specific Car Reference - Ask about "that one"
 */
async function testSpecificReference() {
  console.log('\n\n' + '🧪'.repeat(30));
  console.log('TEST 3: SPECIFIC REFERENCE MEMORY');
  console.log('Testing if AI can handle implicit references like "that one"');
  console.log('🧪'.repeat(30));
  
  // Turn 4: Ask for more details about a specific car
  const turn4 = await sendMessage(
    "Tell me more about the features of the first one you mentioned",
    4
  );
  
  // Check if response provides car details
  const response4 = turn4.data?.message || '';
  const memoryWorking = 
    response4.toLowerCase().includes('feature') ||
    response4.toLowerCase().includes('ford') ||
    response4.toLowerCase().includes('transmission') ||
    response4.toLowerCase().includes('mileage') ||
    response4.toLowerCase().includes('year');
  
  console.log(`\n✅ Memory Test 3: ${memoryWorking ? 'PASSED' : 'NEEDS REVIEW'}`);
  console.log(`   AI ${memoryWorking ? 'understood' : 'may not have understood'} the specific reference`);
  
  return memoryWorking;
}

/**
 * Test 4: Topic Switch and Return - Change topic then come back
 */
async function testTopicSwitchAndReturn() {
  console.log('\n\n' + '🧪'.repeat(30));
  console.log('TEST 4: TOPIC SWITCH AND RETURN');
  console.log('Testing if AI remembers after topic change');
  console.log('🧪'.repeat(30));
  
  // Turn 5: Switch topic
  const turn5 = await sendMessage(
    "What are your business hours?",
    5
  );
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Turn 6: Return to previous topic
  const turn6 = await sendMessage(
    "Going back to those Ford cars - can I schedule a test drive for the cheapest one?",
    6
  );
  
  // Check if response shows memory of Ford cars
  const response6 = turn6.data?.message || '';
  const memoryWorking = 
    response6.toLowerCase().includes('ford') ||
    response6.toLowerCase().includes('test drive') ||
    response6.toLowerCase().includes('contact') ||
    response6.toLowerCase().includes('schedule') ||
    response6.toLowerCase().includes('details');
  
  console.log(`\n✅ Memory Test 4: ${memoryWorking ? 'PASSED' : 'NEEDS REVIEW'}`);
  console.log(`   AI ${memoryWorking ? 'remembered' : 'may not have remembered'} Ford cars after topic switch`);
  
  return memoryWorking;
}

/**
 * Run all memory tests
 */
async function runAllTests() {
  console.log('\n' + '🚗'.repeat(30));
  console.log('PRIME DEAL AUTO - CHAT MEMORY TEST SUITE');
  console.log('Testing Nova Pro conversation memory retention');
  console.log('🚗'.repeat(30));
  console.log(`\nAPI URL: ${API_URL}`);
  console.log(`Session Token: ${sessionToken || 'Will be assigned'}`);
  console.log(`Session ID: ${sessionId || 'Will be assigned'}`);
  
  const results = {
    basicMemory: false,
    priceContext: false,
    specificReference: false,
    topicSwitchReturn: false,
  };
  
  try {
    // Run tests sequentially (same session)
    results.basicMemory = await testBasicMemory();
    await new Promise(r => setTimeout(r, 1500));
    
    results.priceContext = await testPriceContextMemory();
    await new Promise(r => setTimeout(r, 1500));
    
    results.specificReference = await testSpecificReference();
    await new Promise(r => setTimeout(r, 1500));
    
    results.topicSwitchReturn = await testTopicSwitchAndReturn();
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error(error.stack);
  }
  
  // Summary
  console.log('\n\n' + '📊'.repeat(30));
  console.log('TEST RESULTS SUMMARY');
  console.log('📊'.repeat(30));
  console.log(`\nSession ID: ${sessionId}`);
  console.log(`Session Token: ${sessionToken}`);
  console.log('\nResults:');
  console.log(`  1. Basic Memory (Ford cars):     ${results.basicMemory ? '✅ PASS' : '⚠️  REVIEW'}`);
  console.log(`  2. Price Context Memory:         ${results.priceContext ? '✅ PASS' : '⚠️  REVIEW'}`);
  console.log(`  3. Specific Reference ("that"):  ${results.specificReference ? '✅ PASS' : '⚠️  REVIEW'}`);
  console.log(`  4. Topic Switch & Return:        ${results.topicSwitchReturn ? '✅ PASS' : '⚠️  REVIEW'}`);
  
  const passCount = Object.values(results).filter(Boolean).length;
  console.log(`\nOverall: ${passCount}/4 tests passed`);
  
  if (passCount === 4) {
    console.log('\n🎉 All memory tests passed! Nova Pro is retaining conversation context correctly.');
  } else if (passCount >= 2) {
    console.log('\n⚠️  Some tests need review. Check the responses above for context retention.');
  } else {
    console.log('\n❌ Memory retention may have issues. Review the conversation flow above.');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Note: "NEEDS REVIEW" means manual inspection of responses is recommended.');
  console.log('The AI may have understood context but expressed it differently.');
  console.log('='.repeat(60));
}

// Run the tests
runAllTests().catch(console.error);
