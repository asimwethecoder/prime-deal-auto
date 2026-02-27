---
inclusion: always
---

# Bedrock AI Chat Conventions

## API
- Use Converse API (NOT InvokeModel) — unified interface across models, native tool use support
- Requires `bedrock:InvokeModel` IAM permission
- Model: `anthropic.claude-sonnet-4-20250514-v1:0`
- Region: `us-east-1`
- Use `ConverseStream` for streaming responses to improve perceived latency (optional, Phase 3 polish)

## Converse API Request Format
```typescript
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({ region: 'us-east-1' });
// Initialize client OUTSIDE handler for reuse across warm invocations

const response = await client.send(new ConverseCommand({
  modelId: 'anthropic.claude-sonnet-4-20250514-v1:0',
  messages: conversationHistory,
  system: [{ text: systemPrompt }],
  toolConfig: { tools: toolDefinitions },
  inferenceConfig: { maxTokens: 1024, temperature: 0.7 },
}));
```

## Tool Use Pattern
Two tools available to the AI assistant:

### search_cars
Searches inventory based on user criteria.
```json
{
  "name": "search_cars",
  "description": "Search the car inventory based on filters like make, model, price range, year, body type, fuel type, and transmission",
  "inputSchema": {
    "json": {
      "type": "object",
      "properties": {
        "make": { "type": "string", "description": "Car manufacturer (e.g., Toyota, BMW)" },
        "model": { "type": "string", "description": "Car model (e.g., Camry, X5)" },
        "minPrice": { "type": "number", "description": "Minimum price filter" },
        "maxPrice": { "type": "number", "description": "Maximum price filter" },
        "minYear": { "type": "number", "description": "Minimum year filter" },
        "maxYear": { "type": "number", "description": "Maximum year filter" },
        "bodyType": { "type": "string", "description": "Body type (sedan, suv, truck, etc.)" },
        "fuelType": { "type": "string", "description": "Fuel type (petrol, diesel, electric, hybrid)" },
        "transmission": { "type": "string", "description": "Transmission (automatic, manual, cvt)" }
      }
    }
  }
}
```

### get_car_details
Gets full details for a specific car.
```json
{
  "name": "get_car_details",
  "description": "Get detailed information about a specific car by its ID, including images, features, and specifications",
  "inputSchema": {
    "json": {
      "type": "object",
      "properties": {
        "carId": { "type": "string", "description": "The UUID of the car to retrieve" }
      },
      "required": ["carId"]
    }
  }
}
```

## Conversation Loop (Agent Pattern)
1. Receive user message, load conversation history (last 20 messages)
2. Send to Bedrock Converse API with system prompt + tool definitions
3. Check `response.stopReason`:
   - `"end_turn"` → return assistant text response to user
   - `"tool_use"` → extract tool use block, execute the tool, continue loop
4. If tool_use: append assistant message (with toolUse block) + tool result message to history
5. Call Converse again with updated history
6. Repeat until `"end_turn"` or max iterations reached (max 5 tool iterations per turn)
7. Save all messages to database

```typescript
// Simplified agent loop
let response = await client.send(new ConverseCommand({ ... }));
let iterations = 0;

while (response.stopReason === 'tool_use' && iterations < 5) {
  const toolUseBlock = extractToolUse(response);
  const toolResult = await executeTool(toolUseBlock.name, toolUseBlock.input);
  
  messages.push(response.output.message); // assistant message with toolUse
  messages.push({ role: 'user', content: [{ toolResult: { toolUseId: toolUseBlock.toolUseId, content: [{ json: toolResult }] } }] });
  
  response = await client.send(new ConverseCommand({ ...params, messages }));
  iterations++;
}
```

## Configuration
- `maxTokens`: 1024
- `temperature`: 0.7
- Max tool iterations per turn: 5
- Rate limiting: 10 messages/minute per user/session, enforced in handler

## System Prompt Guidelines
The AI acts as a friendly car sales assistant for Prime Deal Auto:
- Knowledgeable about the inventory — always uses tools to look up real data
- Helps users find cars matching their needs and budget
- Suggests alternatives when exact matches aren't available
- Provides pricing context and comparisons in ZAR (South African Rand, R prefix)
- Never makes up car details — always uses tool results
- Encourages users to submit enquiries for cars they like
- Keeps responses concise and conversational

## Session Management
- Sessions stored in `chat_sessions` table (PostgreSQL)
- Messages stored in `chat_messages` table
- Anonymous users get a session token (UUID, stored in cookie/localStorage)
- Authenticated users link sessions to their user ID
- Load last 20 messages for context on reconnect
- Trim older messages to stay within model context window

## Error Handling
- Bedrock throttling (`ThrottlingException`): return friendly "I'm a bit busy right now, please try again in a moment" message
- Tool execution failure: return `toolResult` with `status: 'error'` so the model can respond gracefully
- Model timeout: return a fallback message, don't leave the user hanging
- Never expose raw Bedrock errors or stack traces to the user
- Log all Bedrock interactions (request/response) for debugging, but redact PII

## Lazy Loading
- Import `@aws-sdk/client-bedrock-runtime` lazily (only in chat handler) to avoid cold start penalty for non-chat requests
