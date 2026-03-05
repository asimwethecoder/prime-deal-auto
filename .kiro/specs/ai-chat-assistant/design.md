# Design Document: AI Chat Assistant

## Overview

The AI Chat Assistant provides an intelligent conversational interface that helps users find cars in the Prime Deal Auto inventory. The system integrates Amazon Bedrock (Claude Sonnet 4) with the Converse API to enable natural language interactions with tool use capabilities. The assistant can search the car database and retrieve detailed vehicle information through an iterative agent loop pattern.

The system supports both anonymous and authenticated users, maintains conversation history across sessions, implements rate limiting to prevent abuse, and provides a seamless experience for users to discover vehicles through natural conversation.

Key capabilities:
- Natural language car search using Bedrock's tool use
- Iterative agent loop for multi-turn tool invocations
- Session management for anonymous and authenticated users
- Conversation history persistence and retrieval
- Rate limiting (10 messages/minute per session)
- Graceful error handling for Bedrock failures

## Architecture

### System Components

```
┌─────────────┐
│   Frontend  │
│  (Next.js)  │
└──────┬──────┘
       │ POST /chat
       │ GET /chat/sessions
       │ GET /chat/sessions/:id
       │ DELETE /chat/sessions/:id
       ▼
┌─────────────────────────────────────────┐
│         API Gateway + Lambda            │
│  ┌───────────────────────────────────┐  │
│  │     Chat Handler (chat.handler)   │  │
│  │  - Input validation (Zod)         │  │
│  │  - Rate limiting                  │  │
│  │  - Auth checking                  │  │
│  └───────────┬───────────────────────┘  │
│              │                           │
│  ┌───────────▼───────────────────────┐  │
│  │    Chat Service (chat.service)    │  │
│  │  - Agent loop orchestration       │  │
│  │  - Tool execution                 │  │
│  │  - Session management             │  │
│  │  - Message formatting             │  │
│  └───┬───────────────────────┬───────┘  │
│      │                       │           │
│      │                       │           │
│  ┌───▼──────────┐    ┌──────▼────────┐  │
│  │   Bedrock    │    │  Session Repo │  │
│  │   Client     │    │  Message Repo │  │
│  └───┬──────────┘    └──────┬────────┘  │
│      │                      │            │
└──────┼──────────────────────┼────────────┘
       │                      │
       ▼                      ▼
┌──────────────┐      ┌──────────────┐
│   Bedrock    │      │   Aurora     │
│  Claude 4    │      │  PostgreSQL  │
│  (us-east-1) │      │ (RDS Proxy)  │
└──────────────┘      └──────────────┘
```

### Request Flow

1. User sends message via POST /chat
2. Handler validates input and checks rate limit
3. Service loads conversation history (last 20 messages)
4. Service sends message + history to Bedrock with tool definitions
5. Agent loop begins:
   - If stopReason = "tool_use": extract tool, execute, append results, call Bedrock again
   - If stopReason = "end_turn": return assistant response
   - Max 5 tool iterations per message
6. Service persists all messages to database
7. Handler returns response with session identifiers



## Components and Interfaces

### Handler Layer (`backend/src/handlers/chat.handler.ts`)

Responsibilities:
- Parse and validate incoming requests
- Extract authentication context (JWT claims)
- Enforce rate limiting
- Route to appropriate service methods
- Format responses with consistent structure
- Handle CORS

```typescript
// POST /chat
export async function handlePostChat(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>

// GET /chat/sessions (authenticated only)
export async function handleGetSessions(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>

// GET /chat/sessions/:id
export async function handleGetSession(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>

// DELETE /chat/sessions/:id (authenticated only)
export async function handleDeleteSession(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>
```

### Service Layer (`backend/src/services/chat.service.ts`)

Responsibilities:
- Orchestrate agent loop with Bedrock
- Execute tools (search_cars, get_car_details)
- Manage sessions (create, retrieve, link anonymous to authenticated)
- Load and format conversation history
- Persist messages with metadata
- Format tool results for Bedrock

```typescript
interface ChatService {
  // Send message and get response through agent loop
  sendMessage(params: SendMessageParams): Promise<ChatResponse>
  
  // List all sessions for authenticated user
  listSessions(userId: string): Promise<SessionSummary[]>
  
  // Get full session history
  getSession(sessionId: string, userId?: string, sessionToken?: string): Promise<SessionDetail>
  
  // Delete session
  deleteSession(sessionId: string, userId: string): Promise<void>
}

interface SendMessageParams {
  message: string
  sessionId?: string
  sessionToken?: string
  userId?: string  // from JWT if authenticated
}

interface ChatResponse {
  sessionId: string
  sessionToken?: string  // for anonymous users
  message: string  // assistant response
  createdAt: Date
}
```

### Repository Layer

#### Session Repository (`backend/src/repositories/chat-session.repository.ts`)

```typescript
interface ChatSessionRepository {
  // Create new session
  create(sessionToken: string, userId?: string): Promise<ChatSession>
  
  // Find by session_id
  findById(sessionId: string): Promise<ChatSession | null>
  
  // Find by session_token
  findByToken(sessionToken: string): Promise<ChatSession | null>
  
  // Find all sessions for user
  findByUserId(userId: string): Promise<ChatSession[]>
  
  // Link anonymous session to user
  linkToUser(sessionId: string, userId: string): Promise<void>
  
  // Delete session
  delete(sessionId: string): Promise<void>
  
  // Update session timestamp
  touch(sessionId: string): Promise<void>
}

interface ChatSession {
  id: string
  userId: string | null
  sessionToken: string
  createdAt: Date
  updatedAt: Date
}
```

#### Message Repository (`backend/src/repositories/chat-message.repository.ts`)

```typescript
interface ChatMessageRepository {
  // Insert message
  create(params: CreateMessageParams): Promise<ChatMessage>
  
  // Get messages for session (with limit and ordering)
  findBySessionId(sessionId: string, limit?: number): Promise<ChatMessage[]>
  
  // Get last message for session (for preview)
  findLastBySessionId(sessionId: string): Promise<ChatMessage | null>
}

interface CreateMessageParams {
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata?: Record<string, any>  // for tool use blocks and tool results
}

interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata: Record<string, any>
  createdAt: Date
}
```

### Bedrock Client (`backend/src/lib/bedrock.ts`)

Responsibilities:
- Initialize BedrockRuntimeClient (outside handler)
- Provide tool definitions
- Provide system prompt
- Send ConverseCommand requests
- Parse responses and extract tool use blocks

```typescript
interface BedrockClient {
  // Send message to Bedrock with conversation history
  converse(params: ConverseParams): Promise<ConverseResponse>
}

interface ConverseParams {
  messages: BedrockMessage[]
  system: string
  tools: ToolDefinition[]
  inferenceConfig: {
    maxTokens: number
    temperature: number
  }
}

interface BedrockMessage {
  role: 'user' | 'assistant'
  content: MessageContent[]
}

type MessageContent = 
  | { text: string }
  | { toolUse: ToolUseBlock }
  | { toolResult: ToolResultBlock }

interface ToolUseBlock {
  toolUseId: string
  name: string
  input: Record<string, any>
}

interface ToolResultBlock {
  toolUseId: string
  content: Array<{ json: any }>
  status?: 'success' | 'error'
}

interface ConverseResponse {
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens'
  message: BedrockMessage
  usage: {
    inputTokens: number
    outputTokens: number
  }
}
```

### Rate Limiter (`backend/src/lib/rate-limiter.ts`)

Responsibilities:
- Track message counts per session in memory
- Enforce 10 messages/minute limit
- Reset counts after 60 seconds
- Calculate retry-after time

```typescript
interface RateLimiter {
  // Check if request is allowed
  checkLimit(sessionId: string): RateLimitResult
}

interface RateLimitResult {
  allowed: boolean
  retryAfter?: number  // seconds until reset
}
```



## Data Models

### Database Schema

The chat system uses two existing tables from `backend/db/schema.sql`:

#### chat_sessions

```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_token ON chat_sessions(session_token);
```

Fields:
- `id`: Unique session identifier (UUID)
- `user_id`: Link to authenticated user (NULL for anonymous sessions)
- `session_token`: UUID token for anonymous session identification
- `created_at`: Session creation timestamp
- `updated_at`: Last activity timestamp (updated on each message)

#### chat_messages

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
```

Fields:
- `id`: Unique message identifier (UUID)
- `session_id`: Foreign key to chat_sessions (CASCADE DELETE)
- `role`: Message sender ('user', 'assistant', 'system')
- `content`: Message text content
- `metadata`: JSONB field for tool use blocks and tool results
- `created_at`: Message timestamp

### Metadata Structure

The `metadata` JSONB field stores internal data for reconstructing Bedrock conversation history:

```typescript
// For assistant messages with tool use
{
  "toolUse": {
    "toolUseId": "string",
    "name": "search_cars" | "get_car_details",
    "input": { /* tool parameters */ }
  }
}

// For user messages with tool results
{
  "toolResult": {
    "toolUseId": "string",
    "status": "success" | "error",
    "content": { /* tool response data */ }
  }
}
```

### Tool Definitions

#### search_cars Tool

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
        "minPrice": { "type": "number", "description": "Minimum price in ZAR" },
        "maxPrice": { "type": "number", "description": "Maximum price in ZAR" },
        "minYear": { "type": "number", "description": "Minimum year" },
        "maxYear": { "type": "number", "description": "Maximum year" },
        "bodyType": { "type": "string", "description": "Body type (sedan, suv, truck, etc.)" },
        "fuelType": { "type": "string", "description": "Fuel type (petrol, diesel, electric, hybrid)" },
        "transmission": { "type": "string", "description": "Transmission (automatic, manual, cvt)" }
      }
    }
  }
}
```

#### get_car_details Tool

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

#### get_dealership_info Tool

```json
{
  "name": "get_dealership_info",
  "description": "Get Prime Deal Auto dealership contact information including address, phone number, and business hours",
  "inputSchema": {
    "json": {
      "type": "object",
      "properties": {}
    }
  }
}
```

#### submit_lead Tool

```json
{
  "name": "submit_lead",
  "description": "Submit a customer lead with contact details including country code and location, with optional enquiry message or car interest",
  "inputSchema": {
    "json": {
      "type": "object",
      "properties": {
        "firstName": { "type": "string", "description": "Customer's first name" },
        "lastName": { "type": "string", "description": "Customer's last name" },
        "email": { "type": "string", "description": "Customer's email address" },
        "phone": { "type": "string", "description": "Customer's phone number (without country code)" },
        "countryCode": { "type": "string", "description": "International dialing code (e.g., +27 for South Africa, +1 for USA)" },
        "country": { "type": "string", "description": "Customer's country (e.g., South Africa, USA, UK)" },
        "enquiry": { "type": "string", "description": "Optional enquiry message or question" },
        "carId": { "type": "string", "description": "Optional UUID of the car they're interested in" }
      },
      "required": ["firstName", "lastName", "email", "phone", "countryCode", "country"]
    }
  }
}
```

### System Prompt

```
You are a friendly and knowledgeable car sales assistant for Prime Deal Auto, a car dealership in South Africa.

Your role is to help users find the perfect car from our inventory by understanding their needs and preferences.

Guidelines:
- Always use the search_cars and get_car_details tools to look up real data from our inventory
- Never make up car details, specifications, or prices
- Provide all prices in South African Rand (ZAR) with the R prefix (e.g., R250,000)
- When users describe what they're looking for, use search_cars to find matching vehicles
- If exact matches aren't available, suggest similar alternatives from the inventory
- Keep your responses concise and conversational
- When users show interest in a specific car, encourage them to submit an enquiry or contact us
- Be helpful and enthusiastic, but not pushy

IMPORTANT - Financing Policy:
- Prime Deal Auto does NOT offer financing, payment plans, or installment options
- We only accept cash purchases (full payment upfront)
- NEVER calculate or estimate monthly payments, interest rates, or financing terms
- If users ask about financing, politely explain: "We don't offer financing at Prime Deal Auto. All our vehicles are sold as cash purchases at the total price shown. However, I'd be happy to help you find a car within your budget!"
- Direct interested buyers to submit a lead or visit our showroom to discuss the cash purchase

Handling Search Results:
- When search_cars returns results, check the "total" and "showing" fields
- If total > showing, inform the user: "I found [total] matching cars. Here are the first [showing]:"
- Always mention if there are more results: "There are [total - showing] more cars matching your criteria. Would you like me to narrow down the search with more specific filters?"
- Suggest adding filters (price range, year, body type, etc.) to help users refine large result sets
- If showing all results (total = showing), say: "I found [total] cars matching your criteria:"
- For very large result sets (50+), proactively suggest: "That's quite a few options! Would you like me to help narrow it down by price range, year, or specific features?"

Dealership Information:
- When users ask about our location, address, contact details, or business hours, use the get_dealership_info tool
- Never make up contact information - always use the tool to get accurate details

Lead Capture:
- When users express strong interest in a car or ask to be contacted, offer to collect their contact details
- Use the submit_lead tool to capture: first name, last name, email, phone, country code (e.g., +27), country, and optionally their enquiry message or car of interest
- ALWAYS ask for the country code separately (e.g., "What's your country code? For example, +27 for South Africa")
- ALWAYS ask for their country/location (e.g., "Which country are you in?")
- After successfully submitting a lead, confirm to the user that someone from our team will contact them soon
- Be natural about collecting information - don't ask for all details at once if the conversation doesn't flow that way

Website Navigation & Deep Linking:
When users ask about navigating the website or want to visit specific pages, provide direct links:

Main Pages:
- Home page: https://primedealauto.co.za/
- Browse all cars: https://primedealauto.co.za/cars
- Search cars: https://primedealauto.co.za/search?q=[search term]
- About us: https://primedealauto.co.za/about
- Contact us: https://primedealauto.co.za/contact
- Login: https://primedealauto.co.za/login
- Sign up: https://primedealauto.co.za/signup

User Pages (require login):
- My dashboard: https://primedealauto.co.za/dashboard
- My favorites: https://primedealauto.co.za/favorites

Car Detail Pages:
- ALWAYS provide deep links when discussing specific cars: https://primedealauto.co.za/cars/{carId}
- Use the carId from search_cars or get_car_details tool results
- Example: "You can view full details here: https://primedealauto.co.za/cars/abc-123-def"

Proactive Navigation Suggestions:
- If user asks about company history → suggest /about page
- If user wants to see all inventory → suggest /cars page
- If user wants to search → suggest /search page
- If user wants to save favorites → suggest they login and use /favorites
- If user asks how to contact → provide /contact page link AND use get_dealership_info tool
- For large search results → suggest browsing on /cars page with filters: "You can also browse all [total] cars with advanced filters here: https://primedealauto.co.za/cars"

Remember: You can only provide information about cars that actually exist in our inventory. Always use the tools to verify availability and details.
```



## Agent Loop Implementation

### Agent Loop Pattern

The agent loop is the core mechanism that enables the Chat Assistant to iteratively use tools until it has sufficient information to respond to the user.

```typescript
async function executeAgentLoop(
  userMessage: string,
  conversationHistory: BedrockMessage[],
  bedrockClient: BedrockClient
): Promise<string> {
  const messages = [...conversationHistory, { role: 'user', content: [{ text: userMessage }] }];
  let iterations = 0;
  const MAX_ITERATIONS = 5;

  while (iterations < MAX_ITERATIONS) {
    const response = await bedrockClient.converse({
      messages,
      system: SYSTEM_PROMPT,
      tools: TOOL_DEFINITIONS,
      inferenceConfig: { maxTokens: 1024, temperature: 0.7 }
    });

    // Log Bedrock interaction
    logBedrockInteraction(messages, response);

    if (response.stopReason === 'end_turn') {
      // Extract text response and return
      return extractTextContent(response.message);
    }

    if (response.stopReason === 'tool_use') {
      // Extract tool use block
      const toolUse = extractToolUse(response.message);
      
      // Execute the tool
      const toolResult = await executeTool(toolUse.name, toolUse.input);
      
      // Append assistant message with tool use
      messages.push(response.message);
      
      // Append user message with tool result
      messages.push({
        role: 'user',
        content: [{
          toolResult: {
            toolUseId: toolUse.toolUseId,
            content: [{ json: toolResult }],
            status: toolResult.error ? 'error' : undefined
          }
        }]
      });
      
      iterations++;
      continue;
    }

    // Unexpected stop reason
    break;
  }

  // Max iterations reached or unexpected stop reason
  return extractTextContent(messages[messages.length - 1]) || 
         "I'm having trouble completing that request. Please try rephrasing.";
}
```

### Tool Execution

```typescript
async function executeTool(toolName: string, input: Record<string, any>): Promise<any> {
  try {
    if (toolName === 'search_cars') {
      const results = await carService.searchCars({
        make: input.make,
        model: input.model,
        minPrice: input.minPrice,
        maxPrice: input.maxPrice,
        minYear: input.minYear,
        maxYear: input.maxYear,
        bodyType: input.bodyType,
        fuelType: input.fuelType,
        transmission: input.transmission,
        limit: 20  // Return up to 20 results for better coverage
      });
      
      return {
        success: true,
        cars: results.data.map(car => ({
          id: car.id,
          make: car.make,
          model: car.model,
          year: car.year,
          price: car.price,
          mileage: car.mileage,
          transmission: car.transmission,
          fuelType: car.fuel_type,
          bodyType: car.body_type
        })),
        total: results.total,  // Total matching cars in database
        showing: results.data.length,  // Number of cars in this response
        hasMore: results.total > results.data.length  // Indicates if more results exist
      };
    }

    if (toolName === 'get_car_details') {
      const car = await carService.getCarById(input.carId);
      
      if (!car) {
        return {
          error: 'Car not found',
          message: `No car found with ID ${input.carId}`
        };
      }
      
      return {
        success: true,
        car: {
          id: car.id,
          make: car.make,
          model: car.model,
          variant: car.variant,
          year: car.year,
          price: car.price,
          mileage: car.mileage,
          condition: car.condition,
          transmission: car.transmission,
          fuelType: car.fuel_type,
          bodyType: car.body_type,
          color: car.color,
          description: car.description,
          features: car.features,
          images: car.images?.map(img => img.cloudfront_url) || []
        }
      };
    }

    if (toolName === 'get_dealership_info') {
      return {
        success: true,
        dealership: {
          name: 'Prime Deal Auto',
          address: '515 Louis Botha Ave, Savoy, Johannesburg, 2090',
          phone: '+27 73 214 4072',
          email: 'info@primedealauto.co.za',
          businessHours: {
            weekdays: 'Monday - Friday: 8:00 AM - 6:00 PM',
            saturday: 'Saturday: 9:00 AM - 4:00 PM',
            sunday: 'Sunday: Closed'
          },
          website: 'https://primedealauto.co.za'
        }
      };
    }

    if (toolName === 'submit_lead') {
      // Validate country code format
      if (!input.countryCode || !input.countryCode.startsWith('+')) {
        return {
          error: 'Invalid country code',
          message: 'Country code must start with + (e.g., +27 for South Africa)'
        };
      }

      // Validate country is provided
      if (!input.country || input.country.trim().length === 0) {
        return {
          error: 'Missing country',
          message: 'Country is required'
        };
      }

      const lead = await leadService.createLead({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: `${input.countryCode}${input.phone}`, // Combine country code with phone
        country: input.country,
        enquiry: input.enquiry,
        carId: input.carId,
        source: 'chat_assistant'
      });
      
      return {
        success: true,
        leadId: lead.id,
        message: 'Lead submitted successfully. Our team will contact you soon.'
      };
    }

    return {
      error: 'Unknown tool',
      message: `Tool ${toolName} is not recognized`
    };
  } catch (error) {
    // Log error but don't expose internals
    console.error('Tool execution error:', { toolName, error });
    
    return {
      error: 'Tool execution failed',
      message: 'An error occurred while processing your request'
    };
  }
}
```

### Session Management Logic

```typescript
async function getOrCreateSession(
  sessionId?: string,
  sessionToken?: string,
  userId?: string
): Promise<{ session: ChatSession; isNew: boolean }> {
  // Authenticated user with session_id
  if (userId && sessionId) {
    const session = await sessionRepository.findById(sessionId);
    if (!session || session.userId !== userId) {
      throw new ForbiddenError('Session does not belong to user');
    }
    return { session, isNew: false };
  }

  // Authenticated user without session_id (create new)
  if (userId && !sessionId) {
    const newToken = uuidv4();
    const session = await sessionRepository.create(newToken, userId);
    return { session, isNew: true };
  }

  // Anonymous user with session_token
  if (sessionToken) {
    let session = await sessionRepository.findByToken(sessionToken);
    if (!session) {
      // Create session with provided token
      session = await sessionRepository.create(sessionToken);
    }
    return { session, isNew: !session };
  }

  // Anonymous user without session_token (create new)
  const newToken = uuidv4();
  const session = await sessionRepository.create(newToken);
  return { session, isNew: true };
}

async function linkAnonymousSession(
  sessionToken: string,
  userId: string
): Promise<void> {
  const session = await sessionRepository.findByToken(sessionToken);
  if (session && !session.userId) {
    await sessionRepository.linkToUser(session.id, userId);
  }
}
```

### Conversation History Loading

```typescript
async function loadConversationHistory(sessionId: string): Promise<BedrockMessage[]> {
  const messages = await messageRepository.findBySessionId(sessionId, 20);
  
  return messages.map(msg => {
    if (msg.role === 'user') {
      // Check if this is a tool result message
      if (msg.metadata?.toolResult) {
        return {
          role: 'user',
          content: [{
            toolResult: {
              toolUseId: msg.metadata.toolResult.toolUseId,
              content: [{ json: msg.metadata.toolResult.content }],
              status: msg.metadata.toolResult.status
            }
          }]
        };
      }
      
      // Regular user message
      return {
        role: 'user',
        content: [{ text: msg.content }]
      };
    }

    if (msg.role === 'assistant') {
      // Check if this is a tool use message
      if (msg.metadata?.toolUse) {
        return {
          role: 'assistant',
          content: [
            { text: msg.content },
            {
              toolUse: {
                toolUseId: msg.metadata.toolUse.toolUseId,
                name: msg.metadata.toolUse.name,
                input: msg.metadata.toolUse.input
              }
            }
          ]
        };
      }
      
      // Regular assistant message
      return {
        role: 'assistant',
        content: [{ text: msg.content }]
      };
    }

    // System messages (shouldn't normally be in history)
    return {
      role: 'user',  // Bedrock doesn't support system role in messages
      content: [{ text: msg.content }]
    };
  });
}
```



## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies and consolidations:

**Redundancy Analysis:**
- Properties 4.4 and 4.5 (appending assistant message and tool result) can be combined into a single property about conversation history updates during tool execution
- Properties 5.4, 5.5, and 5.6 (error handling for different error types) can be combined into a comprehensive error handling property
- Properties 9.1 and 9.2 (message persistence for user and assistant) can be combined into a single property about message persistence
- Properties 9.3 and 9.4 (metadata storage for tool use and results) can be combined into a single property about metadata persistence
- Properties 12.2 and 12.3 (authorization for authenticated and anonymous users) can be combined into a single authorization property
- Properties 16.1, 16.2, 16.3, 16.4, 16.5 (various input validations) can be combined into a comprehensive input validation property
- Properties related to response format (17.1-17.7) can be combined into a single property about consistent response structure

**Final Property Set:**
After consolidation, we have 25 distinct properties that provide comprehensive coverage without redundancy.

### Property 1: Conversation History Inclusion

For any user message sent to an existing session, the handler must include the conversation history when calling Bedrock.

**Validates: Requirements 4.1**

### Property 2: Tool Use Block Extraction

For any Bedrock response with stopReason "tool_use", the handler must successfully extract the tool use block from the response.

**Validates: Requirements 4.2**

### Property 3: Tool Execution Dispatch

For any extracted tool use block, the handler must execute the corresponding tool (search_cars or get_car_details) with the provided input parameters.

**Validates: Requirements 4.3**

### Property 4: Conversation History Update During Tool Execution

For any tool execution, the handler must append both the assistant message (containing the tool use block) and the user message (containing the tool result) to the conversation history before the next Bedrock call.

**Validates: Requirements 4.4, 4.5, 4.6**

### Property 5: Agent Loop Termination

For any agent loop execution, the loop must continue iterating until either stopReason is "end_turn" or the maximum iteration count (5) is reached.

**Validates: Requirements 4.7, 4.8**

### Property 6: Final Response Return

For any agent loop that terminates with stopReason "end_turn", the handler must return the assistant's text response to the user.

**Validates: Requirements 4.10**

### Property 7: Search Tool Dispatch

For any tool use block with name "search_cars", the handler must call the Car Service search method with the filter parameters from the tool input.

**Validates: Requirements 5.1**

### Property 8: Details Tool Dispatch

For any tool use block with name "get_car_details", the handler must call the Car Service getById method with the carId from the tool input.

**Validates: Requirements 5.2**

### Property 9: Successful Tool Result Format

For any successful tool execution, the handler must format the result as a tool result with status "success" and the data in JSON format.

**Validates: Requirements 5.3**

### Property 10: Tool Error Handling

For any tool execution that fails (not found, validation error, or internal error), the handler must format the result as a tool result with status "error" and an appropriate message that does not expose internal details for internal errors.

**Validates: Requirements 5.4, 5.5, 5.6**

### Property 11: Tool Use ID Correlation

For any tool result message, the handler must include the toolUseId from the corresponding tool use block to maintain proper correlation.

**Validates: Requirements 5.7**

### Property 12: Anonymous Session Token Generation

For any anonymous user message without a session_token, the session manager must generate a new UUID as the session token and create a session record with null user_id.

**Validates: Requirements 6.1, 6.2**

### Property 13: Existing Session Retrieval

For any message with an existing session_token, the session manager must retrieve the corresponding session from the database.

**Validates: Requirements 6.3**

### Property 14: Idempotent Session Creation

For any session_token provided that doesn't match an existing session, the session manager must create a new session with that token (idempotent creation).

**Validates: Requirements 6.4**

### Property 15: Session Identifiers in Response

For any successful POST /chat response, the handler must include both session_id and session_token (for anonymous users) in the response.

**Validates: Requirements 6.5**

### Property 16: Authenticated User Session Creation

For any authenticated user message without a session_id, the session manager must create a new session linked to the user_id extracted from the JWT.

**Validates: Requirements 7.1, 7.2**

### Property 17: Session Ownership Verification

For any authenticated user message with a session_id, the session manager must verify the session belongs to the user_id from the JWT, returning 403 Forbidden if verification fails.

**Validates: Requirements 7.3, 7.4**

### Property 18: Anonymous Session Migration

For any authenticated user with an existing anonymous session (via session_token), the session manager must link the session to the user_id by updating the user_id field.

**Validates: Requirements 7.5**

### Property 19: Conversation History Limit

For any existing session, the handler must load at most the last 20 messages ordered by created_at ascending when building conversation history.

**Validates: Requirements 8.1, 8.2**

### Property 20: Message Format Conversion

For any message loaded from the database, the handler must format it according to the Bedrock Converse API message format, reconstructing tool use blocks and tool results from metadata when present.

**Validates: Requirements 8.3, 8.4, 8.5**

### Property 21: Message Persistence with Metadata

For any message (user or assistant), the message repository must insert a record with the correct role, content, and metadata (storing tool use blocks and tool results in the metadata JSONB field when applicable).

**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

### Property 22: Rate Limit Enforcement

For any session, the rate limiter must enforce a limit of 10 messages per minute, returning a 429 response with code "RATE_LIMITED" and a "Retry-After" header when the limit is exceeded.

**Validates: Requirements 10.1, 10.2, 10.6**

### Property 23: Rate Limit Window Reset

For any rate limit counter, the limiter must reset the message count after 60 seconds have elapsed from the first message in the window.

**Validates: Requirements 10.5**

### Property 24: Session Listing Authorization

For any authenticated user requesting GET /chat/sessions, the handler must return only sessions belonging to that user_id, ordered by updated_at descending, with session details and message previews (first 100 characters).

**Validates: Requirements 11.2, 11.3, 11.4, 11.5**

### Property 25: Session History Authorization

For any session history request (GET /chat/sessions/:id), the handler must verify ownership (user_id for authenticated, session_token for anonymous) and return all messages ordered by created_at ascending, excluding internal metadata from the response.

**Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.6, 12.7**

### Property 26: Session Deletion Authorization and Idempotency

For any authenticated session deletion request, the handler must verify the session belongs to the user_id, delete the session (which cascades to messages), and return 200 OK even if the session doesn't exist (idempotent).

**Validates: Requirements 13.1, 13.2, 13.4, 13.5**

### Property 27: Bedrock Error Sanitization

For any Bedrock API error, the handler must never expose raw error messages or stack traces to the user, instead returning user-friendly messages or generic INTERNAL_ERROR responses.

**Validates: Requirements 14.5**

### Property 28: Bedrock Interaction Logging

For any Bedrock API call, the handler must log the request and response payloads to CloudWatch with PII redacted for debugging purposes.

**Validates: Requirements 14.6**

### Property 29: Input Validation

For any POST /chat request, the handler must validate that the message field is a non-empty string not exceeding 2000 characters, and that session_id and session_token (if provided) are valid UUIDs, returning 400 with code "VALIDATION_ERROR" on failure.

**Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5, 16.6**

### Property 30: Consistent Response Format

For any chat endpoint response (success or error), the handler must return a consistent JSON structure with success boolean, data/error fields, appropriate status codes, and Content-Type application/json header.

**Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7**



## Error Handling

### Error Categories

#### Bedrock Errors

| Error Type | Handler Response | User Message | Status Code |
|------------|------------------|--------------|-------------|
| ThrottlingException | Friendly message | "I'm a bit busy right now, please try again in a moment" | 503 |
| ValidationException | Log + generic error | Generic INTERNAL_ERROR | 500 |
| Timeout | Fallback message | "I'm having trouble responding right now, please try again" | 504 |
| Other errors | Log + generic error | Generic INTERNAL_ERROR | 500 |

All Bedrock errors are logged with full context but never exposed to users.

#### Tool Execution Errors

| Error Type | Tool Result Status | Message |
|------------|-------------------|---------|
| Car not found | error | "Car not found with ID {carId}" |
| Validation error | error | Descriptive validation message |
| Internal error | error | "An error occurred while processing your request" |

Tool errors are returned to Bedrock as tool results with status "error", allowing the assistant to respond gracefully.

#### Input Validation Errors

| Validation Failure | Response |
|-------------------|----------|
| Missing message field | 400 VALIDATION_ERROR: "Message is required" |
| Empty message | 400 VALIDATION_ERROR: "Message cannot be empty" |
| Message too long | 400 VALIDATION_ERROR: "Message exceeds 2000 character limit" |
| Invalid session_id UUID | 400 VALIDATION_ERROR: "Invalid session_id format" |
| Invalid session_token UUID | 400 VALIDATION_ERROR: "Invalid session_token format" |

#### Authorization Errors

| Scenario | Response |
|----------|----------|
| Anonymous user accessing GET /chat/sessions | 401 UNAUTHORIZED |
| Anonymous user deleting session | 401 UNAUTHORIZED |
| Session doesn't belong to user | 403 FORBIDDEN |
| Session not found (GET) | 404 NOT_FOUND |
| Session not found (DELETE) | 200 OK (idempotent) |

#### Rate Limiting

When rate limit is exceeded:
- Status: 429 Too Many Requests
- Code: RATE_LIMITED
- Message: "Rate limit exceeded. Please try again in {seconds} seconds"
- Header: `Retry-After: {seconds}`

### Error Logging

All errors are logged with structured JSON format:

```typescript
{
  "level": "error",
  "timestamp": "2025-01-15T10:30:00Z",
  "requestId": "abc-123",
  "userId": "user-uuid",
  "sessionId": "session-uuid",
  "errorType": "BedrockThrottlingException",
  "errorMessage": "Rate exceeded",
  "stackTrace": "...",
  "context": {
    "endpoint": "POST /chat",
    "messageLength": 150
  }
}
```

PII (email, phone, full names) is redacted from all logs.

## API Endpoints

### POST /chat

Send a message and receive an AI response.

**Auth Level:** None (public endpoint)

**Request:**
```typescript
{
  "message": string,           // Required, 1-2000 characters
  "sessionId"?: string,        // Optional, UUID
  "sessionToken"?: string      // Optional, UUID (for anonymous users)
}
```

**Response (200 OK):**
```typescript
{
  "success": true,
  "data": {
    "sessionId": string,       // UUID
    "sessionToken"?: string,   // UUID (only for anonymous users)
    "message": string,         // Assistant response
    "createdAt": string        // ISO 8601 timestamp
  }
}
```

**Error Responses:**
- 400 VALIDATION_ERROR: Invalid input
- 403 FORBIDDEN: Session doesn't belong to user
- 429 RATE_LIMITED: Rate limit exceeded
- 500 INTERNAL_ERROR: Server error
- 503 Service Unavailable: Bedrock throttling
- 504 Gateway Timeout: Bedrock timeout

### GET /chat/sessions

List all chat sessions for authenticated user.

**Auth Level:** Cognito (requires valid JWT)

**Response (200 OK):**
```typescript
{
  "success": true,
  "data": [
    {
      "sessionId": string,
      "createdAt": string,
      "updatedAt": string,
      "lastMessagePreview": string  // First 100 chars
    }
  ]
}
```

**Error Responses:**
- 401 UNAUTHORIZED: No valid JWT
- 500 INTERNAL_ERROR: Server error

### GET /chat/sessions/:id

Get full conversation history for a session.

**Auth Level:** Mixed (authenticated users need JWT, anonymous users need session_token in query)

**Query Parameters:**
- `sessionToken` (optional): UUID for anonymous user authorization

**Response (200 OK):**
```typescript
{
  "success": true,
  "data": {
    "sessionId": string,
    "createdAt": string,
    "updatedAt": string,
    "messages": [
      {
        "role": "user" | "assistant",
        "content": string,
        "createdAt": string
      }
    ]
  }
}
```

**Error Responses:**
- 401 UNAUTHORIZED: No valid authorization
- 403 FORBIDDEN: Session doesn't belong to user
- 404 NOT_FOUND: Session doesn't exist
- 500 INTERNAL_ERROR: Server error

### DELETE /chat/sessions/:id

Delete a chat session and all its messages.

**Auth Level:** Cognito (requires valid JWT)

**Response (200 OK):**
```typescript
{
  "success": true
}
```

**Error Responses:**
- 401 UNAUTHORIZED: No valid JWT
- 403 FORBIDDEN: Session doesn't belong to user
- 500 INTERNAL_ERROR: Server error

Note: Returns 200 OK even if session doesn't exist (idempotent delete).



## Testing Strategy

### Dual Testing Approach

The AI Chat Assistant feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of tool execution (search with known filters, get details for specific car)
- Edge cases (empty search results, max iterations reached, session not found)
- Error conditions (Bedrock throttling, invalid UUIDs, unauthorized access)
- Integration points (database operations, Bedrock API calls with mocked responses)

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs (conversation history always includes last 20 messages)
- Input validation across random valid and invalid inputs
- Authorization checks across random user/session combinations
- Message persistence and retrieval across random message sequences
- Rate limiting behavior across random request patterns

Together, unit tests catch concrete bugs in specific scenarios while property tests verify general correctness across the input space.

### Property-Based Testing Configuration

**Library:** fast-check (JavaScript/TypeScript property-based testing library)

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with comment referencing design property
- Tag format: `// Feature: ai-chat-assistant, Property {number}: {property_text}`

**Example Property Test:**

```typescript
import fc from 'fast-check';

// Feature: ai-chat-assistant, Property 19: Conversation History Limit
test('conversation history is limited to last 20 messages', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.array(fc.record({
        role: fc.constantFrom('user', 'assistant'),
        content: fc.string({ minLength: 1, maxLength: 500 })
      }), { minLength: 21, maxLength: 50 }),
      async (messages) => {
        // Setup: Create session and insert messages
        const sessionId = await createTestSession();
        for (const msg of messages) {
          await messageRepository.create({
            sessionId,
            role: msg.role,
            content: msg.content
          });
        }

        // Execute: Load conversation history
        const history = await loadConversationHistory(sessionId);

        // Assert: Only last 20 messages loaded
        expect(history).toHaveLength(20);
        
        // Assert: Messages are in chronological order
        const loadedContent = history.map(m => m.content[0].text);
        const expectedContent = messages.slice(-20).map(m => m.content);
        expect(loadedContent).toEqual(expectedContent);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Test Coverage

**Handler Tests** (`backend/tests/unit/handlers/chat.handler.test.ts`):
- POST /chat with valid message creates session and returns response
- POST /chat with invalid message returns 400 VALIDATION_ERROR
- POST /chat with rate limit exceeded returns 429 RATE_LIMITED
- GET /chat/sessions without auth returns 401 UNAUTHORIZED
- GET /chat/sessions with auth returns user's sessions
- GET /chat/sessions/:id with wrong user returns 403 FORBIDDEN
- DELETE /chat/sessions/:id deletes session and returns 200
- DELETE /chat/sessions/:id for non-existent session returns 200 (idempotent)

**Service Tests** (`backend/tests/unit/services/chat.service.test.ts`):
- sendMessage executes agent loop and returns assistant response
- sendMessage with tool_use executes tool and continues loop
- sendMessage with max iterations returns last response
- sendMessage with Bedrock throttling returns friendly error
- getOrCreateSession creates new session for anonymous user
- getOrCreateSession retrieves existing session by token
- getOrCreateSession links anonymous session to authenticated user
- loadConversationHistory reconstructs Bedrock message format
- executeTool with search_cars calls car service with filters
- executeTool with get_car_details calls car service with carId
- executeTool with not found error returns error tool result

**Repository Tests** (`backend/tests/unit/repositories/chat-session.repository.test.ts`, `chat-message.repository.test.ts`):
- create inserts session with token and user_id
- findById retrieves session by id
- findByToken retrieves session by token
- findByUserId returns all user sessions
- linkToUser updates session user_id
- delete removes session
- message create inserts with metadata
- findBySessionId returns messages ordered by created_at
- findBySessionId respects limit parameter

**Rate Limiter Tests** (`backend/tests/unit/lib/rate-limiter.test.ts`):
- checkLimit allows first 10 messages
- checkLimit blocks 11th message
- checkLimit resets after 60 seconds
- checkLimit returns correct retryAfter value

### Integration Tests

**End-to-End Chat Flow** (`backend/tests/integration/chat-flow.test.ts`):
- Complete conversation with tool use (search → details → enquiry suggestion)
- Anonymous session creation and message persistence
- Authenticated user session linking
- Session history retrieval with correct message ordering
- Rate limiting across multiple requests

### Mocking Strategy

**Bedrock Client:** Mock all Bedrock API calls in unit tests
- Return predefined responses for different scenarios
- Simulate tool_use and end_turn stop reasons
- Simulate throttling and timeout errors

**Database:** Use in-memory PostgreSQL or test database
- Reset schema between tests
- Seed with test data as needed

**Car Service:** Mock in service tests, use real implementation in integration tests

### Test Data Generators

For property-based tests, define custom generators:

```typescript
// Generate valid chat messages
const chatMessageArb = fc.string({ minLength: 1, maxLength: 2000 });

// Generate valid UUIDs
const uuidArb = fc.uuid();

// Generate tool use blocks
const toolUseArb = fc.record({
  toolUseId: fc.uuid(),
  name: fc.constantFrom('search_cars', 'get_car_details'),
  input: fc.dictionary(fc.string(), fc.anything())
});

// Generate Bedrock messages
const bedrockMessageArb = fc.record({
  role: fc.constantFrom('user', 'assistant'),
  content: fc.array(fc.oneof(
    fc.record({ text: fc.string() }),
    fc.record({ toolUse: toolUseArb })
  ))
});
```

### Performance Tests

**Load Testing:**
- Simulate 100 concurrent users sending messages
- Measure response times (target: p95 < 3s for simple queries, < 10s for multi-tool queries)
- Verify rate limiting works under load
- Monitor Lambda cold starts and warm invocation reuse

**Bedrock Token Usage:**
- Track token consumption per conversation
- Verify 20-message history limit keeps context within model limits
- Monitor costs per conversation



## Security Considerations

### Authentication and Authorization

**Public Endpoints:**
- POST /chat: No authentication required (supports anonymous users)
- Session tokens provide anonymous user identification

**Protected Endpoints:**
- GET /chat/sessions: Requires valid Cognito JWT
- DELETE /chat/sessions/:id: Requires valid Cognito JWT
- GET /chat/sessions/:id: Requires either JWT (authenticated) or session_token (anonymous)

**Authorization Checks:**
- Authenticated users can only access their own sessions (verified by user_id)
- Anonymous users can only access sessions matching their session_token
- Cross-user session access returns 403 FORBIDDEN

### Input Validation

All user inputs are validated using Zod schemas:

```typescript
const PostChatSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().uuid().optional(),
  sessionToken: z.string().uuid().optional()
});
```

Validation prevents:
- SQL injection (parameterized queries)
- XSS attacks (no HTML rendering of user content)
- Buffer overflow (message length limits)
- Invalid UUID formats

### Rate Limiting

**Per-Session Limits:**
- 10 messages per minute per session
- Prevents abuse and controls Bedrock costs
- Returns 429 with Retry-After header

**API Gateway Limits:**
- 100 requests/second per IP (stage-level throttle)
- Additional protection against DDoS

### Data Privacy

**PII Handling:**
- User messages may contain PII (names, phone numbers, emails)
- All PII is redacted from CloudWatch logs
- Messages are stored in encrypted Aurora database
- Session tokens are UUIDs (not personally identifiable)

**Data Retention:**
- Chat sessions persist indefinitely unless user deletes
- Users can delete their own sessions via DELETE endpoint
- Cascade delete removes all associated messages

### Bedrock Security

**IAM Permissions:**
- Lambda execution role has bedrock:InvokeModel permission scoped to specific model ARN
- No wildcard permissions on Bedrock actions
- Principle of least privilege

**Error Handling:**
- Never expose Bedrock error messages to users
- Log full errors to CloudWatch for debugging
- Return generic error messages to prevent information leakage

### Database Security

**Connection Security:**
- All connections via RDS Proxy
- SSL/TLS required for all database connections
- Credentials stored in Secrets Manager
- Credentials cached in Lambda memory (not logged)

**Query Safety:**
- Parameterized queries only (no string concatenation)
- Input validation before database operations
- Foreign key constraints prevent orphaned records

## Performance Optimization

### Lambda Optimization

**Cold Start Reduction:**
- ARM64 (Graviton2) runtime for better performance
- Lazy-load Bedrock SDK (only import in chat handler)
- Initialize clients outside handler for reuse
- Bundle with esbuild for smaller package size

**Memory Configuration:**
- 1024 MB memory allocation
- 30-second timeout (accommodates multi-turn agent loops)

**Connection Reuse:**
- Database pool initialized outside handler
- Bedrock client initialized outside handler
- Connections reused across warm invocations

### Database Optimization

**Query Performance:**
- Index on chat_sessions.session_token for fast lookups
- Index on chat_messages.session_id for history queries
- Index on chat_messages.created_at for ordering
- Limit conversation history to 20 messages (reduces query time)

**Connection Pooling:**
- RDS Proxy handles connection pooling server-side
- Lambda uses max 1 connection per instance
- Keep-alive enabled to prevent connection drops

### Bedrock Optimization

**Context Management:**
- Limit history to 20 messages (stays within context window)
- Trim older messages to reduce token consumption
- System prompt is concise (reduces input tokens)

**Tool Result Formatting:**
- Limit search results to 10 cars per tool call
- Return only essential car fields in tool results
- Avoid sending large image URLs in tool results

**Inference Configuration:**
- maxTokens: 1024 (sufficient for conversational responses)
- temperature: 0.7 (balanced creativity and consistency)

### Caching Strategy

**API Gateway Caching:**
- No caching for POST /chat (dynamic, user-specific)
- No caching for GET /chat/sessions (user-specific)
- All chat endpoints bypass cache

**Application-Level Caching:**
- Rate limiter state cached in Lambda memory
- Database credentials cached in Lambda memory
- Tool definitions cached as constants

## Monitoring and Observability

### CloudWatch Metrics

**Custom Metrics:**
- `ChatMessages.Sent`: Count of messages sent
- `ChatMessages.RateLimited`: Count of rate-limited requests
- `BedrockCalls.Success`: Successful Bedrock API calls
- `BedrockCalls.Throttled`: Throttled Bedrock API calls
- `BedrockCalls.Failed`: Failed Bedrock API calls
- `ToolExecutions.{toolName}`: Count per tool type
- `AgentLoop.Iterations`: Distribution of iteration counts
- `AgentLoop.MaxIterationsReached`: Count of max iteration cases

**Dimensions:**
- SessionId
- UserId (for authenticated users)
- ToolName
- ErrorType

### CloudWatch Logs

**Structured Logging:**
All logs use JSON format with consistent fields:

```typescript
{
  "timestamp": "2025-01-15T10:30:00Z",
  "level": "info" | "warn" | "error",
  "requestId": "abc-123",
  "userId": "user-uuid",
  "sessionId": "session-uuid",
  "event": "chat_message_sent" | "tool_executed" | "bedrock_call" | "rate_limited",
  "details": { /* event-specific data */ }
}
```

**Log Events:**
- Chat message received (with message length, not content)
- Bedrock API call (with token counts, latency)
- Tool execution (with tool name, execution time)
- Rate limit violation
- Errors (with stack traces, context)

**PII Redaction:**
- Email addresses replaced with `[EMAIL]`
- Phone numbers replaced with `[PHONE]`
- Full names replaced with `[NAME]`
- Message content not logged (may contain PII)

### Alarms

**Critical Alarms:**
- Bedrock throttling rate > 5% (indicates need for quota increase)
- Error rate > 1% (indicates system issues)
- Lambda duration > 25s (approaching timeout)
- Rate limit violations > 100/hour (potential abuse)

**Warning Alarms:**
- Bedrock latency p95 > 5s (slow responses)
- Database connection errors > 0 (connection pool issues)
- Tool execution failures > 5% (car service issues)

### Dashboards

**Chat Assistant Dashboard:**
- Messages per minute (time series)
- Bedrock API call success rate
- Tool execution distribution (pie chart)
- Agent loop iteration distribution (histogram)
- Error rate by type (stacked area chart)
- Rate limit violations (time series)
- Response time percentiles (p50, p95, p99)

## Deployment Considerations

### Infrastructure Requirements

**Lambda Configuration:**
- Runtime: Node.js 20, ARM64
- Memory: 1024 MB
- Timeout: 30 seconds
- VPC: Attached to private subnets (for Aurora access)
- Environment Variables:
  - `DB_HOST`: RDS Proxy endpoint
  - `DB_NAME`: Database name
  - `DB_SECRET_ARN`: Secrets Manager ARN for credentials
  - `BEDROCK_MODEL_ID`: anthropic.claude-sonnet-4-20250514-v1:0
  - `BEDROCK_REGION`: us-east-1
  - `FRONTEND_URL`: For CORS configuration

**IAM Permissions:**
```typescript
// Lambda execution role policy
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["bedrock:InvokeModel"],
      "Resource": "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-sonnet-4-20250514-v1:0"
    },
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "${DB_SECRET_ARN}"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:CreateNetworkInterface",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DeleteNetworkInterface"
      ],
      "Resource": "*"
    }
  ]
}
```

**API Gateway Configuration:**
- POST /chat: No caching, no authorization
- GET /chat/sessions: No caching, Cognito authorizer
- GET /chat/sessions/{id}: No caching, Cognito authorizer (optional)
- DELETE /chat/sessions/{id}: No caching, Cognito authorizer
- CORS enabled for all endpoints

### Database Migration

No new tables required—chat_sessions and chat_messages already exist in schema.sql.

Verify tables exist:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('chat_sessions', 'chat_messages');
```

### Bedrock Model Access

**Prerequisites:**
- Bedrock model access must be enabled in AWS account
- Navigate to Bedrock console → Model access
- Request access to "Claude Sonnet 4" model
- Wait for approval (usually instant for standard models)

**Verification:**
```bash
aws bedrock list-foundation-models \
  --region us-east-1 \
  --profile prime-deal-auto \
  --query 'modelSummaries[?contains(modelId, `claude-sonnet-4`)]'
```

### Environment Variables

Set in CDK ApiStack:

```typescript
const chatHandler = new NodejsFunction(this, 'ChatHandler', {
  environment: {
    DB_HOST: props.dbProxy.endpoint,
    DB_NAME: 'primedealauto',
    DB_SECRET_ARN: props.dbSecret.secretArn,
    BEDROCK_MODEL_ID: 'anthropic.claude-sonnet-4-20250514-v1:0',
    BEDROCK_REGION: 'us-east-1',
    FRONTEND_URL: props.frontendUrl || '*'
  }
});
```

### Rollback Plan

If issues arise after deployment:

1. **Immediate:** Revert Lambda function to previous version
2. **API Gateway:** Update stage to point to previous Lambda alias
3. **Database:** No schema changes, no rollback needed
4. **Monitoring:** Check CloudWatch logs for error patterns

### Testing in Production

**Smoke Tests:**
- Send test message to POST /chat
- Verify assistant response received
- Check session created in database
- Verify conversation history retrieval
- Test rate limiting (send 11 messages rapidly)

**Monitoring:**
- Watch CloudWatch metrics for first hour
- Check error rates and latency
- Verify Bedrock API calls succeeding
- Monitor Lambda cold starts



## Frontend Integration

### Chat Widget Component

The frontend will implement a chat widget that integrates with the backend API:

**Component Structure:**
```
components/chat/
├── ChatWidget.tsx          # Main widget with toggle button
├── ChatWindow.tsx          # Chat interface (messages + input)
├── MessageBubble.tsx       # Individual message display
├── ChatCarCard.tsx         # Car result card in chat
└── ChatInput.tsx           # Message input with send button
```

**State Management:**
- Use TanStack Query for API calls and caching
- Store session_token in localStorage for anonymous users
- Store session_id in component state during conversation
- Clear session on page reload (start fresh conversation)

**API Integration:**

```typescript
// hooks/useChat.ts
import { useMutation, useQuery } from '@tanstack/react-query';

export function useSendMessage() {
  return useMutation({
    mutationFn: async ({ message, sessionId, sessionToken }: SendMessageParams) => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(getAuthToken() && { Authorization: `Bearer ${getAuthToken()}` })
        },
        body: JSON.stringify({ message, sessionId, sessionToken })
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Store session_token for anonymous users
      if (data.data.sessionToken) {
        localStorage.setItem('chat_session_token', data.data.sessionToken);
      }
    }
  });
}

export function useChatSessions() {
  return useQuery({
    queryKey: ['chat-sessions'],
    queryFn: async () => {
      const response = await fetch('/api/chat/sessions', {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });
      return response.json();
    },
    enabled: !!getAuthToken()  // Only fetch for authenticated users
  });
}
```

**User Experience:**

1. **Widget Placement:** Fixed position bottom-right corner
2. **Initial State:** Collapsed button with chat icon
3. **Expanded State:** Chat window (400px wide, 600px tall on desktop)
4. **Mobile:** Full-screen overlay when expanded
5. **Typing Indicator:** Show "Assistant is typing..." during Bedrock calls
6. **Error Handling:** Display user-friendly error messages in chat
7. **Rate Limiting:** Show countdown timer when rate limited

**Message Display:**

```typescript
// User messages: right-aligned, blue background
// Assistant messages: left-aligned, gray background
// Car cards: Embedded rich cards with image, details, "View Details" button
// Error messages: Red text, centered
```

**Session Management:**

- Anonymous users: session_token stored in localStorage
- Authenticated users: sessions linked to account
- Session history: Available in user dashboard (authenticated only)
- New conversation: Clear session_id to start fresh

**Accessibility:**

- Keyboard navigation (Tab, Enter to send)
- ARIA labels for screen readers
- Focus management (auto-focus input after sending)
- High contrast mode support

### Dashboard Integration

For authenticated users, add a "Chat History" section to the dashboard:

**Features:**
- List all past chat sessions
- Show last message preview and timestamp
- Click to view full conversation
- Delete individual sessions
- Search/filter by date

**Component:**
```typescript
// app/dashboard/chat-history/page.tsx
export default function ChatHistoryPage() {
  const { data: sessions } = useChatSessions();
  
  return (
    <div>
      <h1>Chat History</h1>
      {sessions?.data.map(session => (
        <SessionCard
          key={session.sessionId}
          session={session}
          onDelete={handleDelete}
          onView={handleView}
        />
      ))}
    </div>
  );
}
```

### Real-Time Updates (Future Enhancement)

For Phase 3 polish, consider implementing streaming responses:

- Use Bedrock ConverseStream API
- Stream assistant responses token-by-token
- Improves perceived latency
- Better user experience for long responses

**Implementation:**
```typescript
// Use Server-Sent Events (SSE) or WebSocket
const eventSource = new EventSource('/api/chat/stream');
eventSource.onmessage = (event) => {
  const token = JSON.parse(event.data);
  appendToMessage(token.text);
};
```

## Future Enhancements

### Phase 2 Enhancements

**Conversation Context:**
- Remember user preferences across sessions
- Reference previous conversations
- Personalized recommendations based on chat history

**Rich Responses:**
- Embedded car comparison tables
- Price range visualizations
- Financing calculator integration

**Multi-Language Support:**
- Detect user language
- Respond in user's preferred language
- Translate car descriptions

### Phase 3 Enhancements

**Streaming Responses:**
- Use ConverseStream API
- Token-by-token response display
- Improved perceived latency

**Voice Input:**
- Speech-to-text for message input
- Hands-free car browsing
- Accessibility improvement

**Proactive Suggestions:**
- "Users also asked..." prompts
- Suggested follow-up questions
- Popular search shortcuts

**Analytics Integration:**
- Track conversation topics
- Identify common user needs
- Optimize tool definitions based on usage

**Advanced Tools:**
- `schedule_test_drive`: Book test drives via chat
- `get_financing_options`: Calculate loan payments
- `compare_cars`: Side-by-side comparison tool
- `check_availability`: Real-time inventory status

## Conclusion

The AI Chat Assistant design provides a comprehensive solution for conversational car discovery. The architecture leverages Amazon Bedrock's tool use capabilities to enable natural language interactions with the car inventory, while maintaining security, performance, and scalability.

Key design decisions:
- Agent loop pattern enables iterative tool use
- Session management supports both anonymous and authenticated users
- Rate limiting prevents abuse and controls costs
- Comprehensive error handling ensures graceful degradation
- Property-based testing ensures correctness across input space
- Lazy loading and connection reuse optimize Lambda performance

The design is ready for implementation with clear component boundaries, well-defined interfaces, and comprehensive testing strategy.

