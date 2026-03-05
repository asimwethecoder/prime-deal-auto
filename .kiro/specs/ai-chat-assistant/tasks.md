# Implementation Plan: AI Chat Assistant

## Overview

This implementation plan breaks down the AI Chat Assistant feature into discrete coding tasks. The feature integrates Amazon Bedrock (Claude Sonnet 4) with the Converse API to provide an intelligent conversational interface for car discovery. The implementation follows a layered architecture: handlers → services → repositories, with comprehensive testing at each layer.

The implementation uses TypeScript with Node.js 20 on AWS Lambda, integrating with Aurora PostgreSQL for session/message persistence and Amazon Bedrock for AI capabilities.

## Tasks

- [x] 1. Verify database schema and create types
  - Verify chat_sessions and chat_messages tables exist in backend/db/schema.sql
  - Create TypeScript interfaces for ChatSession and ChatMessage in backend/src/types/chat.types.ts
  - Create Zod schemas for request validation (PostChatSchema, GetSessionSchema)
  - _Requirements: 6.1, 6.2, 9.1, 16.1-16.6_

- [ ] 2. Implement Bedrock client library
  - [x] 2.1 Create Bedrock client wrapper
    - Create backend/src/lib/bedrock.ts with BedrockRuntimeClient initialization (outside handler)
    - Configure client for us-east-1 region and Claude Sonnet 4 model
    - Implement converse() method that wraps ConverseCommand
    - Use lazy import pattern to avoid cold start penalty
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 2.2 Define tool schemas
    - Create TOOL_DEFINITIONS constant with search_cars, get_car_details, get_dealership_info, and submit_lead tools
    - Define JSON Schema for each tool's input parameters
    - Include countryCode and country as required fields in submit_lead tool
    - Include descriptions for each tool and parameter
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13_

  - [x] 2.3 Define system prompt
    - Create SYSTEM_PROMPT constant with assistant role and guidelines
    - Include instructions for tool usage, pricing format (ZAR), and response style
    - Include instructions for using get_dealership_info tool for FAQ questions
    - Include instructions for using submit_lead tool with country code and country collection
    - Include site map with main website pages (home, cars, search, about, contact, login, dashboard, favorites)
    - Include instructions for providing deep links to car detail pages using carId
    - Include instructions for proactive navigation suggestions based on user intent
    - Include explicit NO FINANCING policy: Prime Deal Auto does not offer financing, payment plans, or installments
    - Include instructions to only discuss total cash prices and never calculate monthly payments or interest rates
    - Include polite response template for financing questions directing users to cash purchases
    - Emphasize never making up data and always using tools
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14, 3.15, 3.16, 3.17, 3.18_

  - [ ]* 2.4 Write unit tests for Bedrock client
    - Test converse() method with mocked BedrockRuntimeClient
    - Test tool definition structure validation
    - Test error handling for Bedrock API failures
    - _Requirements: 1.1-1.7, 2.1-2.7, 3.1-3.7_

- [ ] 3. Implement rate limiter
  - [x] 3.1 Create rate limiter class
    - Create backend/src/lib/rate-limiter.ts with RateLimiter class
    - Implement in-memory tracking with Map<sessionId, { count, resetTime }>
    - Implement checkLimit() method that enforces 10 messages/minute
    - Implement reset logic after 60 seconds
    - Calculate retryAfter value for rate limit responses
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [ ]* 3.2 Write unit tests for rate limiter
    - Test allows first 10 messages
    - Test blocks 11th message
    - Test reset after 60 seconds
    - Test retryAfter calculation
    - _Requirements: 10.1-10.6_

- [ ] 4. Implement repository layer
  - [x] 4.1 Create chat session repository
    - Create backend/src/repositories/chat-session.repository.ts
    - Implement create(sessionToken, userId?) method
    - Implement findById(sessionId) method
    - Implement findByToken(sessionToken) method
    - Implement findByUserId(userId) method
    - Implement linkToUser(sessionId, userId) method
    - Implement delete(sessionId) method
    - Implement touch(sessionId) method to update updated_at
    - Use parameterized queries for all database operations
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.2, 7.5, 13.2_

  - [x] 4.2 Create chat message repository
    - Create backend/src/repositories/chat-message.repository.ts
    - Implement create(params) method with role, content, metadata, sessionId
    - Implement findBySessionId(sessionId, limit?) method with ORDER BY created_at ASC
    - Implement findLastBySessionId(sessionId) method for message preview
    - Use parameterized queries for all database operations
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 8.1, 8.2, 11.5_

  - [ ]* 4.3 Write unit tests for repositories
    - Test session create, findById, findByToken, findByUserId, linkToUser, delete
    - Test message create, findBySessionId with limit, findLastBySessionId
    - Use test database or mocked pool
    - Test parameterized query safety
    - _Requirements: 6.1-6.4, 7.2, 7.5, 9.1-9.5, 8.1-8.2, 11.5, 13.2_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement service layer
  - [x] 6.1 Create session management service methods
    - Create backend/src/services/chat.service.ts
    - Implement getOrCreateSession(sessionId?, sessionToken?, userId?) method
    - Handle authenticated user session creation and verification
    - Handle anonymous user session creation and retrieval
    - Implement session linking for authenticated users with existing anonymous sessions
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 6.2 Implement conversation history loading
    - Implement loadConversationHistory(sessionId) method
    - Load last 20 messages ordered by created_at ASC
    - Convert database messages to Bedrock message format
    - Reconstruct tool use blocks from metadata
    - Reconstruct tool results from metadata
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 6.3 Implement tool execution
    - Implement executeTool(toolName, input) method
    - Handle search_cars tool by calling car service search method with limit: 20
    - Return total, showing, and hasMore fields to indicate result set size
    - Handle get_car_details tool by calling car service getById method
    - Handle get_dealership_info tool by returning static dealership information (address: "515 Louis Botha Ave, Savoy, Johannesburg, 2090", phone: "+27 73 214 4072", business hours)
    - Handle submit_lead tool by validating countryCode (starts with +) and country (non-empty), then calling lead service createLead with combined phone number (countryCode + phone) and source "chat_assistant"
    - Format successful results as tool results with status "success"
    - Handle errors (not found, validation, internal) with status "error"
    - Never expose internal error details to Bedrock
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11_

  - [x] 6.4 Implement agent loop
    - Implement executeAgentLoop(userMessage, conversationHistory, bedrockClient) method
    - Send message + history to Bedrock with tools and system prompt
    - Check stopReason and handle "tool_use" vs "end_turn"
    - Extract tool use blocks and execute tools
    - Append assistant message with tool use to history
    - Append user message with tool result to history
    - Continue loop until "end_turn" or max 5 iterations
    - Return final assistant text response
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_

  - [x] 6.5 Implement message persistence
    - Implement persistMessage(sessionId, role, content, metadata?) method
    - Store user messages with role "user"
    - Store assistant messages with role "assistant"
    - Store tool use blocks in metadata JSONB field
    - Store tool results in metadata JSONB field
    - Update session updated_at timestamp after each message
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 6.6 Implement main sendMessage method
    - Implement sendMessage(params: SendMessageParams) method
    - Call getOrCreateSession to get/create session
    - Load conversation history
    - Execute agent loop with user message
    - Persist user message and assistant response
    - Return ChatResponse with sessionId, sessionToken, message, createdAt
    - _Requirements: 4.1-4.10, 6.1-6.6, 7.1-7.5, 8.1-8.6, 9.1-9.6_

  - [x] 6.7 Implement session listing and retrieval
    - Implement listSessions(userId) method
    - Implement getSession(sessionId, userId?, sessionToken?) method with authorization
    - Implement deleteSession(sessionId, userId) method with authorization
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [ ]* 6.8 Write unit tests for service layer
    - Test getOrCreateSession for all scenarios (anonymous, authenticated, linking)
    - Test loadConversationHistory with tool use/result reconstruction
    - Test executeTool for all four tools (search_cars, get_car_details, get_dealership_info, submit_lead) with success and error cases
    - Test executeAgentLoop with mocked Bedrock responses (tool_use, end_turn, max iterations)
    - Test sendMessage end-to-end with mocked dependencies
    - Test session listing, retrieval, and deletion with authorization
    - _Requirements: 4.1-4.10, 5.1-5.10, 6.1-6.6, 7.1-7.5, 8.1-8.6, 9.1-9.6, 11.1-11.5, 12.1-12.7, 13.1-13.6_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement handler layer
  - [x] 8.1 Create POST /chat handler
    - Create backend/src/handlers/chat.handler.ts
    - Implement handlePostChat(event) function
    - Validate request body with Zod schema (message, sessionId?, sessionToken?)
    - Extract userId from JWT claims if authenticated
    - Check rate limit with RateLimiter
    - Call chatService.sendMessage()
    - Return 200 with success response including sessionId, sessionToken, message, createdAt
    - Handle errors: 400 VALIDATION_ERROR, 403 FORBIDDEN, 429 RATE_LIMITED, 500 INTERNAL_ERROR
    - Include CORS headers
    - _Requirements: 16.1-16.7, 17.1-17.7, 10.1-10.6, 6.1-6.6, 7.1-7.5, 15.1-15.5_

  - [x] 8.2 Create GET /chat/sessions handler
    - Implement handleGetSessions(event) function
    - Require authentication (check JWT claims)
    - Extract userId from JWT
    - Call chatService.listSessions(userId)
    - Return 200 with sessions array ordered by updated_at DESC
    - Handle errors: 401 UNAUTHORIZED, 500 INTERNAL_ERROR
    - Include CORS headers
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 17.3, 15.1-15.5_

  - [x] 8.3 Create GET /chat/sessions/:id handler
    - Implement handleGetSession(event) function
    - Extract sessionId from path parameters
    - Extract userId from JWT if authenticated, sessionToken from query if anonymous
    - Call chatService.getSession(sessionId, userId?, sessionToken?)
    - Return 200 with session details and messages array
    - Handle errors: 401 UNAUTHORIZED, 403 FORBIDDEN, 404 NOT_FOUND, 500 INTERNAL_ERROR
    - Include CORS headers
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 17.4, 15.1-15.5_

  - [x] 8.4 Create DELETE /chat/sessions/:id handler
    - Implement handleDeleteSession(event) function
    - Require authentication (check JWT claims)
    - Extract sessionId from path parameters and userId from JWT
    - Call chatService.deleteSession(sessionId, userId)
    - Return 200 OK (idempotent, even if session doesn't exist)
    - Handle errors: 401 UNAUTHORIZED, 403 FORBIDDEN, 500 INTERNAL_ERROR
    - Include CORS headers
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 17.5, 15.1-15.5_

  - [x] 8.5 Implement Bedrock error handling
    - Add try-catch wrapper for Bedrock API calls
    - Handle ThrottlingException with user-friendly message and 503 status
    - Handle ValidationException with generic INTERNAL_ERROR and logging
    - Handle timeout with fallback message and 504 status
    - Handle other errors with generic INTERNAL_ERROR and logging
    - Never expose raw Bedrock errors to users
    - Log all Bedrock requests/responses with PII redaction
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

  - [ ]* 8.6 Write unit tests for handlers
    - Test POST /chat with valid/invalid input, rate limiting, authentication scenarios
    - Test GET /chat/sessions with/without authentication
    - Test GET /chat/sessions/:id with authorization checks
    - Test DELETE /chat/sessions/:id with authorization and idempotency
    - Test Bedrock error handling (throttling, timeout, validation)
    - Test CORS headers on all responses
    - Mock service layer dependencies
    - _Requirements: 10.1-10.6, 11.1-11.6, 12.1-12.7, 13.1-13.6, 14.1-14.6, 15.1-15.5, 16.1-16.7, 17.1-17.7_

- [ ] 9. Integrate handlers with Lambda router
  - [x] 9.1 Add chat routes to Lambda router
    - Update backend/src/lambda.ts to import chat handlers
    - Add POST /chat route
    - Add GET /chat/sessions route
    - Add GET /chat/sessions/:id route with regex pattern
    - Add DELETE /chat/sessions/:id route with regex pattern
    - Ensure OPTIONS handling for CORS preflight
    - _Requirements: 15.1-15.5_

  - [ ]* 9.2 Write integration tests for routing
    - Test all chat routes are correctly matched
    - Test path parameter extraction for session ID
    - Test OPTIONS preflight handling
    - _Requirements: 15.1-15.5_

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Update infrastructure for Bedrock permissions
  - [x] 11.1 Add Bedrock IAM permissions to Lambda role
    - Update infrastructure/lib/stacks/api-stack.ts
    - Add bedrock:InvokeModel permission for Claude Sonnet 4 model ARN
    - Scope permission to specific model: arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-sonnet-4-20250514-v1:0
    - _Requirements: 18.1, 18.5_

  - [x] 11.2 Add environment variables to Lambda
    - Add BEDROCK_MODEL_ID environment variable
    - Add BEDROCK_REGION environment variable (us-east-1)
    - Ensure DB_HOST, DB_NAME, DB_SECRET_ARN are already set
    - _Requirements: 1.1, 1.2_

  - [ ]* 11.3 Write CDK tests for infrastructure
    - Test Lambda has bedrock:InvokeModel permission
    - Test environment variables are set correctly
    - Test Lambda timeout is 30 seconds
    - Test Lambda memory is 1024 MB
    - _Requirements: 18.1-18.5, 20.1-20.6_

- [ ] 12. Add structured logging
  - [ ] 12.1 Create logging utility
    - Create backend/src/lib/logger.ts with structured JSON logging functions
    - Implement logInfo, logWarn, logError with consistent format
    - Implement PII redaction (email, phone, names)
    - Include requestId, userId, sessionId in log context
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7_

  - [ ] 12.2 Add logging to handlers and services
    - Log incoming POST /chat requests with message length
    - Log Bedrock API calls with token counts and latency
    - Log tool invocations with tool name and execution time
    - Log rate limit violations
    - Log all errors with stack traces and context
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7_

- [ ] 13. Property-based tests for correctness properties
  - [ ]* 13.1 Write property test for conversation history limit
    - **Property 19: Conversation History Limit**
    - **Validates: Requirements 8.1, 8.2**
    - Generate random message arrays (21-50 messages)
    - Verify only last 20 messages loaded
    - Verify chronological order maintained

  - [ ]* 13.2 Write property test for message persistence
    - **Property 21: Message Persistence with Metadata**
    - **Validates: Requirements 9.1-9.5**
    - Generate random messages with various roles and metadata
    - Verify all messages persisted correctly
    - Verify metadata stored in JSONB field

  - [ ]* 13.3 Write property test for rate limit enforcement
    - **Property 22: Rate Limit Enforcement**
    - **Validates: Requirements 10.1, 10.2, 10.6**
    - Generate random request patterns
    - Verify 10 messages/minute limit enforced
    - Verify 429 response with Retry-After header

  - [ ]* 13.4 Write property test for input validation
    - **Property 29: Input Validation**
    - **Validates: Requirements 16.1-16.6**
    - Generate random valid and invalid inputs
    - Verify validation catches all invalid cases
    - Verify 400 VALIDATION_ERROR responses

  - [ ]* 13.5 Write property test for session authorization
    - **Property 17: Session Ownership Verification**
    - **Validates: Requirements 7.3, 7.4**
    - Generate random user/session combinations
    - Verify ownership checks work correctly
    - Verify 403 FORBIDDEN for unauthorized access

- [ ] 14. Integration tests for end-to-end flows
  - [ ]* 14.1 Write integration test for complete chat flow
    - Test anonymous user sends message → session created → response received
    - Test authenticated user sends message → session linked → response received
    - Test conversation with tool use (search → details → response)
    - Test session history retrieval with correct message ordering
    - Test rate limiting across multiple requests
    - Use test database and mocked Bedrock client
    - _Requirements: 4.1-4.10, 5.1-5.7, 6.1-6.6, 7.1-7.5, 8.1-8.6, 9.1-9.6, 10.1-10.6_

  - [ ]* 14.2 Write integration test for session management
    - Test session creation for anonymous and authenticated users
    - Test session listing for authenticated users
    - Test session retrieval with authorization
    - Test session deletion with cascade to messages
    - Test anonymous session linking to authenticated user
    - _Requirements: 6.1-6.6, 7.1-7.5, 11.1-11.6, 12.1-12.7, 13.1-13.6_

  - [ ]* 14.3 Write integration test for context memory (CRITICAL)
    - **Test 1: Implicit Reference to Make**
      - Message 1: "Show me blue Ford cars"
      - Verify: AI searches for Ford with color blue
      - Message 2: "What about a red one?"
      - Verify: AI searches for Ford with color red (remembers make)
    - **Test 2: Implicit Reference to Previous Car**
      - Message 1: "Show me BMW X5"
      - Message 2: "Tell me more about it"
      - Verify: AI calls get_car_details with X5's carId from previous search
    - **Test 3: Multi-Turn Refinement**
      - Message 1: "I'm looking for an SUV"
      - Message 2: "Under R500,000"
      - Message 3: "Automatic transmission"
      - Verify: AI searches with bodyType=SUV, maxPrice=500000, transmission=automatic
    - **Test 4: Pronoun Resolution**
      - Message 1: "Show me Toyota Fortuner"
      - Message 2: "Is it available in diesel?"
      - Verify: AI understands "it" refers to Fortuner
    - **Test 5: Conversation Continuity After Tool Use**
      - Message 1: "Search for Mercedes"
      - AI uses search_cars tool
      - Message 2: "What's the cheapest one?"
      - Verify: AI references results from previous search
    - **Test 6: Context Across 10+ Messages**
      - Simulate 15-message conversation about finding a car
      - Verify: AI maintains context throughout (budget, preferences, make)
      - Message 15: "Remind me what my budget was?"
      - Verify: AI recalls budget from message 3
    - Use mocked Bedrock client that validates conversation history is passed correctly
    - _Requirements: 8.1-8.6, 4.1-4.10_

- [ ] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Deployment and verification
  - [ ] 16.1 Deploy infrastructure changes
    - Run `npx cdk diff --profile prime-deal-auto` to review changes
    - Run `npx cdk deploy PrimeDeals-Api --profile prime-deal-auto`
    - Verify Lambda has Bedrock permissions in AWS Console
    - Verify environment variables are set correctly

  - [ ] 16.2 Verify Bedrock model access
    - Check Bedrock model access in AWS Console (us-east-1)
    - Request access to Claude Sonnet 4 if not already enabled
    - Run verification command: `aws bedrock list-foundation-models --region us-east-1 --profile prime-deal-auto --query 'modelSummaries[?contains(modelId, \`claude-sonnet-4\`)]'`

  - [ ] 16.3 Run smoke tests
    - Send test message to POST /chat endpoint
    - Verify assistant response received
    - Check session created in database
    - Verify conversation history retrieval works
    - Test rate limiting (send 11 messages rapidly)
    - Monitor CloudWatch logs for errors

  - [ ] 16.4 Monitor initial deployment
    - Watch CloudWatch metrics for first hour
    - Check error rates and latency
    - Verify Bedrock API calls succeeding
    - Monitor Lambda cold starts and warm invocations
    - Check database connection pool health

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across input space
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows with real database
- The implementation uses TypeScript with strict type checking
- All database operations use parameterized queries for security
- Bedrock client is lazy-loaded to avoid cold start penalty
- Rate limiting is enforced in-memory within Lambda execution context
- All errors are logged with structured JSON format and PII redaction
