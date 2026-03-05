# Requirements Document: AI Chat Assistant

## Introduction

The AI Chat Assistant feature provides an intelligent conversational interface that helps users find cars in the Prime Deal Auto inventory. The assistant uses Amazon Bedrock (Claude Sonnet 4) with the Converse API and tool use capabilities to search the car database and provide detailed information about vehicles. The system supports both anonymous and authenticated users, maintains conversation history, and implements rate limiting to prevent abuse.

## Glossary

- **Chat_Assistant**: The AI-powered conversational agent that interacts with users to help them find cars
- **Bedrock_Client**: The AWS SDK client that communicates with Amazon Bedrock's Converse API
- **Tool**: A function that the Chat_Assistant can invoke to retrieve data (search_cars, get_car_details, get_dealership_info, submit_lead)
- **Session**: A conversation thread between a user and the Chat_Assistant, identified by a unique session_id
- **Session_Token**: A UUID that identifies anonymous user sessions, stored in browser cookie or localStorage
- **Agent_Loop**: The iterative process where the Chat_Assistant receives a message, potentially invokes tools, and generates a response
- **Tool_Use_Block**: A structured message from Bedrock indicating the Chat_Assistant wants to invoke a tool
- **Tool_Result**: The data returned from executing a tool, sent back to Bedrock to continue the conversation
- **Conversation_History**: The sequence of messages (user, assistant, tool results) within a session
- **Rate_Limiter**: A mechanism that restricts the number of messages a user can send within a time window
- **Message_Handler**: The Lambda function that processes POST /chat requests
- **Session_Manager**: The service component that creates and retrieves chat sessions
- **Message_Repository**: The database access layer for chat_messages table operations
- **Session_Repository**: The database access layer for chat_sessions table operations
- **Lead_Service**: The service component that creates leads in the database
- **Country_Code**: The international dialing code for the customer's country (e.g., +27 for South Africa)
- **Deep_Link**: A direct URL to a specific page or resource (e.g., /cars/{carId} for a car detail page)
- **Navigation_Intent**: User's expressed desire to visit a specific page or section of the website
- **Site_Map**: A structured list of website pages and their purposes that the AI can reference

## Requirements

### Requirement 1: Bedrock Integration

**User Story:** As a system, I want to integrate with Amazon Bedrock's Converse API, so that I can provide AI-powered conversational assistance to users.

#### Acceptance Criteria

1. THE Bedrock_Client SHALL use the model ID "anthropic.claude-sonnet-4-20250514-v1:0"
2. THE Bedrock_Client SHALL connect to the us-east-1 region
3. THE Bedrock_Client SHALL be initialized outside the Lambda handler function for connection reuse across warm invocations
4. THE Bedrock_Client SHALL use the ConverseCommand API for all chat interactions
5. THE Bedrock_Client SHALL set maxTokens to 1024 in the inferenceConfig
6. THE Bedrock_Client SHALL set temperature to 0.7 in the inferenceConfig
7. WHEN the Bedrock_Client is imported, THE Message_Handler SHALL lazy-load the @aws-sdk/client-bedrock-runtime module to avoid cold start penalties for non-chat requests

### Requirement 2: Tool Definitions

**User Story:** As the Chat_Assistant, I want to have access to tool definitions, so that I can search the inventory, retrieve car details, get dealership information, capture leads, and help users navigate the website.

#### Acceptance Criteria

1. THE Message_Handler SHALL provide a tool named "search_cars" to the Bedrock_Client
2. THE search_cars tool SHALL accept optional parameters: make, model, minPrice, maxPrice, minYear, maxYear, bodyType, fuelType, transmission
3. THE search_cars tool description SHALL state "Search the car inventory based on filters like make, model, price range, year, body type, fuel type, and transmission"
4. THE Message_Handler SHALL provide a tool named "get_car_details" to the Bedrock_Client
5. THE get_car_details tool SHALL accept a required parameter: carId (string, UUID format)
6. THE get_car_details tool description SHALL state "Get detailed information about a specific car by its ID, including images, features, and specifications"
7. THE Message_Handler SHALL provide a tool named "get_dealership_info" to the Bedrock_Client
8. THE get_dealership_info tool SHALL accept no parameters and return dealership contact information
9. THE get_dealership_info tool description SHALL state "Get Prime Deal Auto dealership contact information including address, phone number, and business hours"
10. THE Message_Handler SHALL provide a tool named "submit_lead" to the Bedrock_Client
11. THE submit_lead tool SHALL accept required parameters: firstName, lastName, email, phone, countryCode, country, and optional parameters: enquiry, carId
12. THE submit_lead tool description SHALL state "Submit a customer lead with contact details including country code and location, with optional enquiry message or car interest"
13. THE Message_Handler SHALL define tool input schemas using JSON Schema format compatible with Bedrock's toolConfig specification

### Requirement 3: System Prompt

**User Story:** As the Chat_Assistant, I want to have a clear system prompt, so that I understand my role and behavior guidelines.

#### Acceptance Criteria

1. THE Message_Handler SHALL provide a system prompt that identifies the Chat_Assistant as a friendly car sales assistant for Prime Deal Auto
2. THE system prompt SHALL instruct the Chat_Assistant to always use tools to look up real data from the inventory
3. THE system prompt SHALL instruct the Chat_Assistant to never make up car details or specifications
4. THE system prompt SHALL instruct the Chat_Assistant to provide pricing in ZAR (South African Rand) with R prefix
5. THE system prompt SHALL instruct the Chat_Assistant to suggest alternatives when exact matches are not available
6. THE system prompt SHALL instruct the Chat_Assistant to keep responses concise and conversational
7. THE system prompt SHALL instruct the Chat_Assistant to encourage users to submit enquiries for cars they are interested in
8. THE system prompt SHALL instruct the Chat_Assistant to use the get_dealership_info tool when users ask about contact information, address, or business hours
9. THE system prompt SHALL instruct the Chat_Assistant to use the submit_lead tool to capture customer contact details when users express interest in a car or want to be contacted
10. THE system prompt SHALL include a site map with key website pages and their purposes (home, cars listing, search, about, contact, login, dashboard, favorites)
11. THE system prompt SHALL instruct the Chat_Assistant to provide direct links to relevant pages when users express navigation intent
12. THE system prompt SHALL instruct the Chat_Assistant to always include deep links to car detail pages (/cars/{carId}) when discussing specific vehicles
13. THE system prompt SHALL instruct the Chat_Assistant to proactively suggest relevant pages based on user questions (e.g., suggest /about when asked about company history)
14. THE system prompt SHALL instruct the Chat_Assistant to collect country code and country information when capturing leads
15. THE system prompt SHALL explicitly instruct the Chat_Assistant that Prime Deal Auto does NOT offer financing or payment plans
16. THE system prompt SHALL instruct the Chat_Assistant to only discuss the total cash price of vehicles
17. THE system prompt SHALL instruct the Chat_Assistant to never calculate or estimate monthly payments, interest rates, or financing terms
18. THE system prompt SHALL instruct the Chat_Assistant to direct interested buyers to submit a lead or visit the showroom for direct cash purchases

### Requirement 4: Agent Loop Pattern

**User Story:** As the Message_Handler, I want to implement an agent loop, so that the Chat_Assistant can iteratively use tools until it has enough information to respond.

#### Acceptance Criteria

1. WHEN the Message_Handler receives a user message, THE Message_Handler SHALL send the Conversation_History to the Bedrock_Client
2. WHEN the Bedrock_Client returns a response with stopReason "tool_use", THE Message_Handler SHALL extract the Tool_Use_Block from the response
3. WHEN a Tool_Use_Block is extracted, THE Message_Handler SHALL execute the corresponding tool with the provided input parameters
4. WHEN a tool is executed, THE Message_Handler SHALL append the assistant message containing the Tool_Use_Block to the Conversation_History
5. WHEN a tool is executed, THE Message_Handler SHALL append a user message containing the Tool_Result to the Conversation_History
6. WHEN a Tool_Result is appended, THE Message_Handler SHALL call the Bedrock_Client again with the updated Conversation_History
7. THE Agent_Loop SHALL continue iterating until the stopReason is "end_turn" or the maximum iteration count is reached
8. THE Agent_Loop SHALL have a maximum iteration limit of 5 tool invocations per user message
9. WHEN the maximum iteration limit is reached, THE Message_Handler SHALL return the last assistant response to the user
10. WHEN the stopReason is "end_turn", THE Message_Handler SHALL return the assistant's text response to the user

### Requirement 5: Tool Execution

**User Story:** As the Message_Handler, I want to execute tools requested by the Chat_Assistant, so that it can access real inventory data, dealership information, and capture leads with complete contact details.

#### Acceptance Criteria

1. WHEN the Chat_Assistant requests the search_cars tool, THE Message_Handler SHALL call the Car_Service search method with the provided filter parameters
2. WHEN the Chat_Assistant requests the get_car_details tool, THE Message_Handler SHALL call the Car_Service getById method with the provided carId
3. WHEN the Chat_Assistant requests the get_dealership_info tool, THE Message_Handler SHALL return dealership contact information including address "515 Louis Botha Ave, Savoy, Johannesburg, 2090", phone "+27 73 214 4072", and business hours
4. WHEN the Chat_Assistant requests the submit_lead tool, THE Message_Handler SHALL call the Lead_Service create method with the provided contact details including countryCode, country, and optional enquiry/carId
5. WHEN a tool execution succeeds, THE Message_Handler SHALL format the result as a Tool_Result with status "success" and the data in JSON format
6. WHEN a tool execution fails due to a not found error, THE Message_Handler SHALL format the result as a Tool_Result with status "error" and a descriptive message
7. WHEN a tool execution fails due to a validation error, THE Message_Handler SHALL format the result as a Tool_Result with status "error" and a descriptive message
8. WHEN a tool execution fails due to an internal error, THE Message_Handler SHALL format the result as a Tool_Result with status "error" and a generic message without exposing internal details
9. THE Message_Handler SHALL include the toolUseId from the Tool_Use_Block in the Tool_Result message
10. WHEN the submit_lead tool succeeds, THE Message_Handler SHALL return the lead_id in the tool result to confirm successful submission
11. WHEN the submit_lead tool is called, THE Message_Handler SHALL validate that countryCode starts with "+" and country is a non-empty string

### Requirement 6: Session Management for Anonymous Users

**User Story:** As an anonymous user, I want to have a persistent chat session, so that I can continue my conversation across page reloads.

#### Acceptance Criteria

1. WHEN an anonymous user sends a message without a session_token, THE Session_Manager SHALL generate a new UUID as the Session_Token
2. WHEN a new Session_Token is generated, THE Session_Manager SHALL create a new record in the chat_sessions table with the Session_Token and null user_id
3. WHEN an anonymous user sends a message with an existing session_token, THE Session_Manager SHALL retrieve the session from the chat_sessions table using the Session_Token
4. WHEN a session_token is provided but no matching session exists, THE Session_Manager SHALL create a new session with the provided Session_Token
5. THE Message_Handler SHALL return the session_id and session_token in the response to POST /chat
6. THE Message_Handler SHALL include the session_token in the response headers or body for client-side storage

### Requirement 7: Session Management for Authenticated Users

**User Story:** As an authenticated user, I want my chat sessions to be linked to my account, so that I can access my conversation history from any device.

#### Acceptance Criteria

1. WHEN an authenticated user sends a message, THE Session_Manager SHALL extract the user_id from the Cognito JWT claims
2. WHEN an authenticated user sends a message without a session_id, THE Session_Manager SHALL create a new session linked to the user_id
3. WHEN an authenticated user sends a message with a session_id, THE Session_Manager SHALL verify the session belongs to the user_id
4. WHEN a session does not belong to the authenticated user, THE Message_Handler SHALL return a 403 Forbidden error with code "FORBIDDEN"
5. WHEN an authenticated user has an existing anonymous session (via session_token), THE Session_Manager SHALL link the session to the user_id by updating the user_id field

### Requirement 8: Conversation History Loading

**User Story:** As the Message_Handler, I want to load conversation history, so that the Chat_Assistant has context for the current conversation.

#### Acceptance Criteria

1. WHEN processing a message for an existing session, THE Message_Handler SHALL load the last 20 messages from the chat_messages table for the session_id
2. THE Message_Handler SHALL order messages by created_at ascending when loading Conversation_History
3. THE Message_Handler SHALL format each message according to the Bedrock Converse API message format (role and content)
4. WHEN a message contains tool use metadata, THE Message_Handler SHALL reconstruct the Tool_Use_Block in the message content
5. WHEN a message contains tool result metadata, THE Message_Handler SHALL reconstruct the Tool_Result in the message content
6. THE Message_Handler SHALL append the new user message to the loaded Conversation_History before sending to Bedrock

### Requirement 9: Message Persistence

**User Story:** As the system, I want to persist all messages, so that users can review their conversation history.

#### Acceptance Criteria

1. WHEN a user sends a message, THE Message_Repository SHALL insert a record in chat_messages with role "user" and the message content
2. WHEN the Chat_Assistant generates a response, THE Message_Repository SHALL insert a record in chat_messages with role "assistant" and the response content
3. WHEN the Chat_Assistant uses a tool, THE Message_Repository SHALL store the Tool_Use_Block in the metadata JSONB field
4. WHEN a Tool_Result is generated, THE Message_Repository SHALL store the Tool_Result in the metadata JSONB field
5. THE Message_Repository SHALL set the session_id foreign key for all inserted messages
6. THE Message_Repository SHALL allow the created_at timestamp to default to NOW()

### Requirement 10: Rate Limiting

**User Story:** As the system, I want to rate limit chat messages, so that I can prevent abuse and control costs.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL enforce a limit of 10 messages per minute per session
2. WHEN a user exceeds the rate limit, THE Message_Handler SHALL return a 429 Too Many Requests response with code "RATE_LIMITED"
3. THE Rate_Limiter SHALL use the session_id as the rate limit key
4. THE Rate_Limiter SHALL track message counts in memory within the Lambda execution context
5. THE Rate_Limiter SHALL reset the message count after 60 seconds have elapsed
6. WHEN returning a rate limit error, THE Message_Handler SHALL include a "Retry-After" header with the number of seconds until the limit resets

### Requirement 11: Session Listing

**User Story:** As an authenticated user, I want to list my chat sessions, so that I can resume previous conversations.

#### Acceptance Criteria

1. THE Session_Repository SHALL provide a method to retrieve all sessions for a given user_id
2. WHEN an authenticated user requests GET /chat/sessions, THE Message_Handler SHALL return all sessions belonging to the user_id from the JWT
3. THE Message_Handler SHALL order sessions by updated_at descending
4. THE Message_Handler SHALL include the session_id, created_at, and updated_at fields in the response
5. THE Message_Handler SHALL include a preview of the last message in each session (first 100 characters of content)
6. WHEN an anonymous user requests GET /chat/sessions, THE Message_Handler SHALL return a 401 Unauthorized error with code "UNAUTHORIZED"

### Requirement 12: Session History Retrieval

**User Story:** As a user, I want to retrieve the full history of a chat session, so that I can review past conversations.

#### Acceptance Criteria

1. WHEN a user requests GET /chat/sessions/:id, THE Message_Handler SHALL retrieve all messages for the session_id ordered by created_at ascending
2. WHEN an authenticated user requests a session, THE Message_Handler SHALL verify the session belongs to the user_id from the JWT
3. WHEN an anonymous user requests a session, THE Message_Handler SHALL verify the session_token matches the session
4. WHEN a session does not belong to the requesting user, THE Message_Handler SHALL return a 403 Forbidden error with code "FORBIDDEN"
5. WHEN a session does not exist, THE Message_Handler SHALL return a 404 Not Found error with code "NOT_FOUND"
6. THE Message_Handler SHALL return messages with role, content, and created_at fields
7. THE Message_Handler SHALL exclude internal metadata fields (tool use blocks, tool results) from the response

### Requirement 13: Session Deletion

**User Story:** As an authenticated user, I want to delete my chat sessions, so that I can remove conversations I no longer need.

#### Acceptance Criteria

1. WHEN an authenticated user requests DELETE /chat/sessions/:id, THE Message_Handler SHALL verify the session belongs to the user_id from the JWT
2. WHEN verification succeeds, THE Session_Repository SHALL delete the session record from chat_sessions
3. WHEN a session is deleted, THE database SHALL cascade delete all associated messages from chat_messages due to the ON DELETE CASCADE constraint
4. WHEN a session does not belong to the requesting user, THE Message_Handler SHALL return a 403 Forbidden error with code "FORBIDDEN"
5. WHEN a session does not exist, THE Message_Handler SHALL return a 200 OK response (idempotent delete)
6. WHEN an anonymous user requests session deletion, THE Message_Handler SHALL return a 401 Unauthorized error with code "UNAUTHORIZED"

### Requirement 14: Error Handling for Bedrock Failures

**User Story:** As the Message_Handler, I want to handle Bedrock API failures gracefully, so that users receive helpful error messages.

#### Acceptance Criteria

1. WHEN the Bedrock_Client throws a ThrottlingException, THE Message_Handler SHALL return a user-friendly message "I'm a bit busy right now, please try again in a moment"
2. WHEN the Bedrock_Client throws a ValidationException, THE Message_Handler SHALL log the error details and return a 500 Internal Server Error with code "INTERNAL_ERROR"
3. WHEN the Bedrock_Client times out, THE Message_Handler SHALL return a fallback message "I'm having trouble responding right now, please try again"
4. WHEN the Bedrock_Client throws any other error, THE Message_Handler SHALL log the error with request context and return a 500 Internal Server Error with code "INTERNAL_ERROR"
5. THE Message_Handler SHALL never expose raw Bedrock error messages or stack traces to the user
6. THE Message_Handler SHALL log all Bedrock request and response payloads to CloudWatch for debugging, excluding PII

### Requirement 15: CORS Support

**User Story:** As the frontend application, I want the chat API to support CORS, so that I can make requests from the browser.

#### Acceptance Criteria

1. WHEN the Message_Handler receives an OPTIONS request to /chat, THE Message_Handler SHALL return a 200 OK response with CORS headers
2. THE Message_Handler SHALL include the "Access-Control-Allow-Origin" header with the frontend URL or "*" for development
3. THE Message_Handler SHALL include the "Access-Control-Allow-Methods" header with "GET,POST,DELETE,OPTIONS"
4. THE Message_Handler SHALL include the "Access-Control-Allow-Headers" header with "Content-Type,Authorization"
5. THE Message_Handler SHALL include CORS headers on all chat endpoint responses (success and error)

### Requirement 16: Input Validation

**User Story:** As the Message_Handler, I want to validate user input, so that I can reject malformed requests early.

#### Acceptance Criteria

1. WHEN a user sends a POST /chat request, THE Message_Handler SHALL validate that the request body contains a "message" field
2. THE Message_Handler SHALL validate that the "message" field is a non-empty string
3. THE Message_Handler SHALL validate that the "message" field does not exceed 2000 characters
4. WHEN the "session_id" field is provided, THE Message_Handler SHALL validate it is a valid UUID format
5. WHEN the "session_token" field is provided, THE Message_Handler SHALL validate it is a valid UUID format
6. WHEN validation fails, THE Message_Handler SHALL return a 400 Bad Request response with code "VALIDATION_ERROR" and a descriptive error message
7. THE Message_Handler SHALL use Zod schemas for all input validation

### Requirement 17: Response Format

**User Story:** As the frontend application, I want consistent response formats, so that I can reliably parse API responses.

#### Acceptance Criteria

1. WHEN POST /chat succeeds, THE Message_Handler SHALL return a 200 OK response with success: true
2. THE successful POST /chat response SHALL include a "data" object containing: session_id, session_token (if anonymous), message (assistant response), and created_at
3. WHEN GET /chat/sessions succeeds, THE Message_Handler SHALL return a 200 OK response with success: true and a "data" array of session objects
4. WHEN GET /chat/sessions/:id succeeds, THE Message_Handler SHALL return a 200 OK response with success: true and a "data" object containing session details and messages array
5. WHEN DELETE /chat/sessions/:id succeeds, THE Message_Handler SHALL return a 200 OK response with success: true
6. WHEN any chat endpoint fails, THE Message_Handler SHALL return a response with success: false, an "error" message, and a "code" field
7. THE Message_Handler SHALL set the "Content-Type" header to "application/json" for all responses

### Requirement 18: IAM Permissions

**User Story:** As the Lambda execution role, I want appropriate IAM permissions, so that I can invoke Bedrock and access the database.

#### Acceptance Criteria

1. THE Lambda execution role SHALL have the "bedrock:InvokeModel" permission for the Claude Sonnet 4 model ARN
2. THE Lambda execution role SHALL have permissions to connect to the Aurora cluster via RDS Proxy
3. THE Lambda execution role SHALL have permissions to read database credentials from Secrets Manager
4. THE Lambda execution role SHALL have permissions to write logs to CloudWatch Logs
5. THE Lambda execution role SHALL follow the principle of least privilege with no wildcard permissions on sensitive actions

### Requirement 19: Logging and Observability

**User Story:** As a developer, I want comprehensive logging, so that I can debug issues and monitor system behavior.

#### Acceptance Criteria

1. THE Message_Handler SHALL log each incoming POST /chat request with session_id, user_id (if authenticated), and message length
2. THE Message_Handler SHALL log each Bedrock API call with model ID, token count, and latency
3. THE Message_Handler SHALL log each tool invocation with tool name, input parameters, and execution time
4. THE Message_Handler SHALL log rate limit violations with session_id and timestamp
5. THE Message_Handler SHALL log all errors with stack traces, request context, and correlation IDs
6. THE Message_Handler SHALL use structured JSON logging format for all log entries
7. THE Message_Handler SHALL redact PII (email addresses, phone numbers, full names) from logs

### Requirement 20: Performance Optimization

**User Story:** As the system, I want optimized performance, so that users receive fast responses.

#### Acceptance Criteria

1. THE Bedrock_Client SHALL be initialized outside the Lambda handler to enable connection reuse across warm invocations
2. THE database connection pool SHALL be initialized outside the Lambda handler to enable connection reuse
3. THE Message_Handler SHALL lazy-load the Bedrock SDK only when processing chat requests
4. THE Message_Handler SHALL limit Conversation_History to the last 20 messages to stay within Bedrock context window limits
5. THE Message_Handler SHALL set the Lambda timeout to 30 seconds to accommodate multi-turn agent loops
6. THE Message_Handler SHALL use parameterized SQL queries for all database operations to enable query plan caching
