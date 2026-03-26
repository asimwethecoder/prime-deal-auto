# Bedrock Model Selection Guide

## Current Model: Amazon Nova Lite

Prime Deal Auto uses **Amazon Nova Lite** (`amazon.nova-lite-v1:0`) for the AI chat assistant.

**Reason:** Nova Pro is not available. Claude Sonnet 4 requires Anthropic use case form submission which is pending approval. Nova Lite is cost-effective, supports tool use via Converse API, and is immediately available.

## Nova Lite Specifications

| Specification | Value |
|---------------|-------|
| Model ID | `amazon.nova-lite-v1:0` |
| Context Window | 300,000 tokens (~225,000 words) |
| Max Output Tokens | 5,000 tokens |
| Throughput | ~150 tokens/second |
| Modalities | Text, images, video, documents |
| Tool Use | Supported via Converse API |
| Streaming | Supported |
| Inference Timeout | 60 minutes |

## Model Comparison

### Quality & Capabilities

| Capability | Claude Sonnet 4 | Amazon Nova Lite |
|------------|-----------------|------------------|
| Tool/Function Calling | Excellent - industry-leading | Functional - works with greedy decoding |
| Multi-turn Conversation | Superior context retention | Good with proper history management |
| Reasoning Quality | Best-in-class | Adequate for straightforward tasks |
| Access Restrictions | Requires use case form | None - immediately available |
| Response Quality | Natural, conversational | Clear, structured |
| Context Window | 200K tokens | 300K tokens |
| Throughput | ~42 tok/s | ~150 tok/s |

### Cost Comparison (per 1M tokens, us-east-1)

| Model | Input Cost | Output Cost | Blended (1M+1M) |
|-------|------------|-------------|-----------------|
| Amazon Nova Pro | $0.80 | $3.20 | $4.00 |
| Claude Sonnet 4 | $3.00 | $15.00 | $18.00 |
| Claude 3.5 Haiku | $0.80 | $4.00 | $4.80 |
| Amazon Nova Lite | $0.06 | $0.24 | $0.30 |

**Nova Lite is ~60x cheaper than Claude Sonnet 4**

### Cost Projection for Prime Deal Auto

**Assumptions:**
- 5,000 chat conversations/month
- Average 3 turns per conversation = 15,000 API calls
- Average 1,500 input tokens, 400 output tokens per response

**Monthly Cost Estimate:**

| Model | Input Cost | Output Cost | Total/Month |
|-------|------------|-------------|-------------|
| Amazon Nova Lite | $1.35 | $1.44 | **$2.79** |
| Amazon Nova Pro | $18.00 | $19.20 | **$37.20** |
| Claude Sonnet 4 | $67.50 | $90.00 | **$157.50** |

**Annual Savings with Nova Lite vs Nova Pro:** ~$413/year
**Annual Savings with Nova Lite vs Claude Sonnet 4:** ~$1,857/year

---

## Nova Lite Best Practices (from AWS Documentation)

### 1. Conversation Memory & Context Retention

**CRITICAL: Preventing "Forgetting" Previous Messages**

Nova Lite does NOT have built-in session memory. You MUST:

1. **Load conversation history before each request**: Always include previous messages in the `messages` array
2. **Persist messages to database**: Store both user and assistant messages after each turn
3. **Use consistent session IDs**: Track conversations with session tokens/IDs

```typescript
// Current implementation in chat.service.ts
async loadConversationHistory(sessionId: string): Promise<BedrockMessage[]> {
  // Load last 20 messages from database
  const messages = await this.messageRepository.findBySessionId(sessionId, 20);
  // Convert to Bedrock message format and return
}
```

**Why 20 messages?** Balances context retention with token costs. With ~1,500 tokens per turn, 20 messages ≈ 30,000 tokens, well within the 300K context window while keeping costs reasonable.

### 2. Preventing User Confusion

**Clear, Unambiguous Responses**

From AWS docs: "Amazon Nova models demonstrate a strong capability for following instructions, but only when the prompts provided are clear and specific."

Guidelines for system prompt:
- Define the assistant's role explicitly
- Provide clear instructions for each task type
- Use structured formatting (bullet points, numbered lists)
- Avoid assumptions — be explicit about what the model should do

**Current system prompt structure:**
```
1. Role definition: "You are a friendly car sales assistant for Prime Deal Auto"
2. Tool usage instructions: "Always use search_cars and get_car_details tools"
3. Response format: "Provide prices in ZAR with R prefix"
4. Constraints: "Never make up car details"
5. Handling edge cases: "If no matches, suggest alternatives"
```

### 3. Tool Use Best Practices

**For reliable tool calling with Nova Lite:**

```typescript
// Use greedy decoding for more consistent tool calls
inferenceConfig: {
  maxTokens: 1024,
  temperature: 0,  // Greedy decoding — critical for Lite's tool use reliability
}

// Pass topK via additionalModelRequestFields
additionalModelRequestFields: {
  inferenceConfig: { topK: 1 }
}
```

**Tool troubleshooting:**
- If tools are ignored: Use `toolChoice` parameter to force tool use
- If tool output truncated: Increase `maxTokens` (tool results can be large)
- Nova uses chain-of-thought reasoning with `<thinking>` tags — don't suppress this

### 4. System Prompt Best Practices

From AWS documentation:

1. **Define 4 dimensions:**
   - Task: What the model should accomplish
   - Role: The persona the model should assume
   - Response Style: Format and structure of outputs
   - Instructions: Step-by-step guidance

2. **Structure long prompts:**
   - Use markdown formatting
   - Use bullet points for lists
   - Break complex instructions into atomic steps

3. **Be explicit, avoid assumptions:**
   - Don't assume the model knows context
   - Provide clear guidance for edge cases
   - Specify what NOT to do (e.g., "Never make up prices")

### 5. Inference Parameters

**Recommended settings for chat assistant:**

```typescript
const inferenceConfig = {
  maxTokens: 1024,      // Cap output to control costs
  temperature: 0.7,     // Balanced creativity (0 for tool use)
  topP: 0.9,            // Nucleus sampling
  stopSequences: [],    // Optional stop sequences
};

// Nova-specific: topK via additionalModelRequestFields
const additionalModelRequestFields = {
  inferenceConfig: {
    topK: 50  // Limits vocabulary diversity
  }
};
```

**Parameter guidance:**
- `temperature: 0` — Use for tool calling (greedy decoding)
- `temperature: 0.7` — Use for conversational responses
- `maxTokens: 1024` — Sufficient for chat, prevents runaway generation
- `topK` — Must be passed via `additionalModelRequestFields`, not `inferenceConfig`

### 6. Handling Long Conversations

**Context window management:**

```typescript
// Trim history if approaching context limit
const MAX_HISTORY_MESSAGES = 20;
const messages = await this.messageRepository.findBySessionId(sessionId, MAX_HISTORY_MESSAGES);
```

**From AWS docs:** "Put long-form data at the beginning. Place your long documents and inputs near the beginning of your prompt, before your query, instructions, and examples."

For chat: System prompt → Conversation history → Current user message

### 7. Error Handling

**Common errors and solutions:**

| Error | Cause | Solution |
|-------|-------|----------|
| `ModelErrorException` with invalid ToolUse | Temperature too high | Set `temperature: 0` for tool calls |
| `ValidationException` | Invalid tool schema | Ensure top-level schema is `type: "object"` with only `type`, `properties`, `required` |
| Repetitive loops | Escaped Unicode | Add instruction: "Do NOT output escaped Unicode" |
| Tool ignored | Model chose not to use | Use `toolChoice: { tool: { name: "tool_name" } }` |

---

## Current Implementation

### Model Configuration

```typescript
// backend/src/lib/bedrock.ts
const modelId = process.env.BEDROCK_MODEL_ID || 'amazon.nova-lite-v1:0';

const inferenceConfig = {
  maxTokens: 1024,
  temperature: 0.7,
};
```

### Conversation Flow

```
1. User sends message
2. Load last 20 messages from database (loadConversationHistory)
3. Build messages array: history + new user message
4. Call Bedrock Converse API with system prompt + tools
5. If tool_use: execute tool, append result, call again (max 5 iterations)
6. Persist user message and assistant response to database
7. Return response to user
```

### IAM Permissions

```typescript
// infrastructure/lib/stacks/api-stack.ts
chatLambda.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['bedrock:InvokeModel'],
    resources: [
      `arn:aws:bedrock:${this.region}::foundation-model/amazon.nova-lite-v1:0`,
    ],
  })
);
```

### Environment Variables

```bash
BEDROCK_MODEL_ID=amazon.nova-lite-v1:0
BEDROCK_REGION=us-east-1
```

---

## Cost Optimization Strategies

### 1. MaxTokens Enforcement
Always set `maxTokens: 1024` to prevent runaway generation.

### 2. Conversation History Trimming
Load only last 20 messages for context — balances memory with cost.

### 3. Rate Limiting
Enforce 10 messages/minute per session in handler.

### 4. Greedy Decoding for Tools
Use `temperature: 0` when expecting tool calls to reduce retries.

---

## Future: Upgrade Path

When better models become available, switch by updating three things:

1. Update `BEDROCK_MODEL_ID` environment variable in api-stack.ts
2. Update IAM permissions to the new model ARN in api-stack.ts
3. Redeploy API stack

### Option A: Upgrade to Nova Pro (if access is restored)
- Model ID: `amazon.nova-pro-v1:0`
- Better reasoning quality, same API interface
- ~13x more expensive than Lite

### Option B: Upgrade to Claude Sonnet 4 (when approved)

### Steps to Request Claude Access

1. Navigate to: Bedrock Console → Model Access → Anthropic
2. Submit use case details:
   - **Title**: AI-Powered Car Sales Assistant
   - **Description**: Sales assistant for Prime Deal Auto dealership in South Africa
   - **Volume**: 5,000-50,000 conversations/month
   - **Industry**: Automotive Retail

Approval typically takes 15 minutes to a few hours.

---

## File References

- Bedrock implementation: #[[file:backend/src/lib/bedrock.ts]]
- Chat service: #[[file:backend/src/services/chat.service.ts]]
- API stack (IAM): #[[file:infrastructure/lib/stacks/api-stack.ts]]
- Chat types: #[[file:backend/src/types/chat.types.ts]]
