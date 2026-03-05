/**
 * Chat Lambda Handler (No VPC)
 * 
 * This Lambda is NOT attached to the VPC, allowing it to access Bedrock directly.
 * It uses the VPC Proxy Lambda for all database operations.
 * 
 * Architecture:
 * API Gateway → Chat Lambda (No VPC) → Bedrock
 *                    ↓
 *              VPC Proxy Lambda (VPC) → Aurora
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { converse, TOOL_DEFINITIONS, SYSTEM_PROMPT } from './lib/bedrock';
import { getRateLimiter } from './lib/rate-limiter';
import { PostChatSchema, BedrockMessage, ToolUseBlock } from './types/chat.types';
import { success, error, corsResponse } from './lib/response';
import { sessionProxy, messageProxy, leadProxy, carProxy } from './lib/vpc-proxy-client';

const rateLimiter = getRateLimiter();

/**
 * POST /chat - Send a message and get AI response
 */
export async function handlePostChat(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    // Parse and validate request body
    if (!event.body) {
      return error('Request body is required', 'VALIDATION_ERROR', 400);
    }

    const body = JSON.parse(event.body);
    const validation = PostChatSchema.safeParse(body);

    if (!validation.success) {
      return error(
        validation.error.errors[0].message,
        'VALIDATION_ERROR',
        400
      );
    }

    const { message, sessionId, sessionToken } = validation.data;

    // Extract userId from JWT if authenticated
    const userId = event.requestContext.authorizer?.claims?.sub;

    // Get or create session
    const session = await getOrCreateSession(sessionId, sessionToken, userId);

    // Check rate limit
    const rateLimitResult = rateLimiter.checkLimit(session.id);
    if (!rateLimitResult.allowed) {
      return {
        statusCode: 429,
        headers: {
          'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
          'Content-Type': 'application/json',
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
        },
        body: JSON.stringify({
          success: false,
          error: 'Too many requests. Please try again later.',
          code: 'RATE_LIMITED',
        }),
      };
    }

    // Load conversation history
    const conversationHistory = await loadConversationHistory(session.id);

    // Execute agent loop with Bedrock
    const assistantResponse = await executeAgentLoop(message, conversationHistory);

    // Persist user message
    await messageProxy.create({
      sessionId: session.id,
      role: 'user',
      content: message,
    });

    // Persist assistant response
    await messageProxy.create({
      sessionId: session.id,
      role: 'assistant',
      content: assistantResponse,
    });

    return success({
      sessionId: session.id,
      sessionToken: session.user_id ? undefined : session.session_token,
      message: assistantResponse,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('POST /chat error:', err);

    if (err instanceof SyntaxError) {
      return error('Invalid JSON in request body', 'VALIDATION_ERROR', 400);
    }

    if (err instanceof Error) {
      if (err.message.startsWith('FORBIDDEN:')) {
        return error(err.message.replace('FORBIDDEN: ', ''), 'FORBIDDEN', 403);
      }
      if (err.message.startsWith('NOT_FOUND:')) {
        return error(err.message.replace('NOT_FOUND: ', ''), 'NOT_FOUND', 404);
      }
    }

    return error('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

/**
 * GET /chat/sessions - List all sessions for authenticated user
 */
export async function handleGetSessions(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;

    if (!userId) {
      return error('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const sessions = await sessionProxy.findByUserId(userId);

    const summaries = [];
    for (const session of sessions) {
      const lastMessage = await messageProxy.findLastBySessionId(session.id);
      summaries.push({
        sessionId: session.id,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
        lastMessagePreview: lastMessage
          ? lastMessage.content.substring(0, 100)
          : '',
      });
    }

    return success(summaries);
  } catch (err) {
    console.error('GET /chat/sessions error:', err);
    return error('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

/**
 * GET /chat/sessions/:id - Get full session history
 */
export async function handleGetSession(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const sessionId = event.pathParameters?.id;
    const sessionToken = event.queryStringParameters?.sessionToken;
    const userId = event.requestContext.authorizer?.claims?.sub;

    if (!sessionId) {
      return error('Session ID is required', 'VALIDATION_ERROR', 400);
    }

    const session = await sessionProxy.findById(sessionId);

    if (!session) {
      return error('Session not found', 'NOT_FOUND', 404);
    }

    // Authorization check
    if (userId && session.user_id !== userId) {
      return error('Forbidden', 'FORBIDDEN', 403);
    }

    if (!userId && sessionToken && session.session_token !== sessionToken) {
      return error('Forbidden', 'FORBIDDEN', 403);
    }

    const messages = await messageProxy.findBySessionId(sessionId);

    return success({
      sessionId: session.id,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        createdAt: msg.created_at,
      })),
    });
  } catch (err) {
    console.error('GET /chat/sessions/:id error:', err);
    return error('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

/**
 * DELETE /chat/sessions/:id - Delete a session
 */
export async function handleDeleteSession(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const sessionId = event.pathParameters?.id;
    const userId = event.requestContext.authorizer?.claims?.sub;

    if (!sessionId) {
      return error('Session ID is required', 'VALIDATION_ERROR', 400);
    }

    if (!userId) {
      return error('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const session = await sessionProxy.findById(sessionId);

    if (session && session.user_id !== userId) {
      return error('Forbidden', 'FORBIDDEN', 403);
    }

    // Idempotent - don't throw if session doesn't exist
    if (session) {
      await sessionProxy.delete(sessionId);
    }

    return success({ message: 'Session deleted successfully' });
  } catch (err) {
    console.error('DELETE /chat/sessions/:id error:', err);
    return error('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

/**
 * Helper: Get or create session
 */
async function getOrCreateSession(
  sessionId?: string,
  sessionToken?: string,
  userId?: string
): Promise<any> {
  // Authenticated user with session_id
  if (userId && sessionId) {
    const session = await sessionProxy.findById(sessionId);
    if (!session || session.user_id !== userId) {
      throw new Error('FORBIDDEN: Session does not belong to user');
    }
    return session;
  }

  // Authenticated user without session_id (create new)
  if (userId && !sessionId) {
    const newToken = uuidv4();
    return await sessionProxy.create(newToken, userId);
  }

  // Anonymous user with session_token
  if (sessionToken) {
    let session = await sessionProxy.findByToken(sessionToken);
    if (!session) {
      session = await sessionProxy.create(sessionToken);
    }
    return session;
  }

  // Anonymous user without session_token (create new)
  const newToken = uuidv4();
  return await sessionProxy.create(newToken);
}

/**
 * Helper: Load conversation history
 */
async function loadConversationHistory(sessionId: string): Promise<BedrockMessage[]> {
  const messages = await messageProxy.findBySessionId(sessionId, 20);

  return messages.map((msg: any) => {
    if (msg.role === 'user') {
      if (msg.metadata?.toolResult) {
        return {
          role: 'user',
          content: [
            {
              toolResult: {
                toolUseId: msg.metadata.toolResult.toolUseId,
                content: [{ json: msg.metadata.toolResult.content }],
                status: msg.metadata.toolResult.status,
              },
            },
          ],
        };
      }
      return {
        role: 'user',
        content: [{ text: msg.content }],
      };
    }

    if (msg.role === 'assistant') {
      if (msg.metadata?.toolUse) {
        const content: any[] = [];
        if (msg.content) {
          content.push({ text: msg.content });
        }
        content.push({
          toolUse: {
            toolUseId: msg.metadata.toolUse.toolUseId,
            name: msg.metadata.toolUse.name,
            input: msg.metadata.toolUse.input,
          },
        });
        return {
          role: 'assistant',
          content,
        };
      }
      return {
        role: 'assistant',
        content: [{ text: msg.content }],
      };
    }

    return {
      role: 'user' as const,
      content: [{ text: msg.content }],
    };
  });
}

/**
 * Helper: Execute agent loop with Bedrock
 */
async function executeAgentLoop(
  userMessage: string,
  conversationHistory: BedrockMessage[]
): Promise<string> {
  const messages: BedrockMessage[] = [
    ...conversationHistory,
    { role: 'user', content: [{ text: userMessage }] },
  ];

  let iterations = 0;
  const MAX_ITERATIONS = 5;

  while (iterations < MAX_ITERATIONS) {
    const response = await converse({
      messages,
      system: SYSTEM_PROMPT,
      tools: TOOL_DEFINITIONS,
      inferenceConfig: { maxTokens: 1024, temperature: 0.7 },
    });

    console.log('Bedrock interaction:', {
      iteration: iterations + 1,
      stopReason: response.stopReason,
      inputTokens: response.usage.inputTokens,
      outputTokens: response.usage.outputTokens,
    });

    if (response.stopReason === 'end_turn') {
      return extractTextContent(response.message);
    }

    if (response.stopReason === 'tool_use') {
      const toolUse = extractToolUse(response.message);

      if (!toolUse) {
        console.error('Failed to extract tool use from response');
        break;
      }

      const toolResult = await executeTool(toolUse.name, toolUse.input);

      messages.push(response.message);
      messages.push({
        role: 'user',
        content: [
          {
            toolResult: {
              toolUseId: toolUse.toolUseId,
              content: [{ json: toolResult }],
              status: toolResult.error ? 'error' : undefined,
            },
          },
        ],
      });

      iterations++;
      continue;
    }

    console.warn('Unexpected stop reason:', response.stopReason);
    break;
  }

  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role === 'assistant') {
    return extractTextContent(lastMessage);
  }

  return "I'm having trouble completing that request. Please try rephrasing.";
}

/**
 * Helper: Execute tool via VPC proxy
 */
async function executeTool(toolName: string, input: Record<string, any>): Promise<any> {
  try {
    if (toolName === 'search_cars') {
      const results = await carProxy.listCars({
        make: input.make,
        model: input.model,
        minPrice: input.minPrice,
        maxPrice: input.maxPrice,
        minYear: input.minYear,
        maxYear: input.maxYear,
        bodyType: input.bodyType,
        fuelType: input.fuelType,
        transmission: input.transmission,
        limit: 20,
      });

      return {
        success: true,
        cars: results.cars.map((car: any) => ({
          id: car.id,
          make: car.make,
          model: car.model,
          year: car.year,
          price: car.price,
          mileage: car.mileage,
          transmission: car.transmission,
          fuelType: car.fuel_type,
          bodyType: car.body_type,
        })),
        total: results.total,
        showing: results.cars.length,
        hasMore: results.hasMore,
      };
    }

    if (toolName === 'get_car_details') {
      const car = await carProxy.getById(input.carId);

      if (!car) {
        return {
          error: 'Car not found',
          message: `No car found with ID ${input.carId}`,
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
        },
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
            sunday: 'Sunday: Closed',
          },
          website: 'https://primedealauto.co.za',
        },
      };
    }

    if (toolName === 'submit_lead') {
      if (!input.countryCode || !input.countryCode.startsWith('+')) {
        return {
          error: 'Invalid country code',
          message: 'Country code must start with + (e.g., +27 for South Africa)',
        };
      }

      if (!input.country || input.country.trim().length === 0) {
        return {
          error: 'Missing country',
          message: 'Country is required',
        };
      }

      const leadId = await leadProxy.create({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        country: input.country,
        enquiry: input.enquiry,
        carId: input.carId,
        source: 'ai_chat',
      });

      return {
        success: true,
        leadId,
        message: 'Lead submitted successfully. Our team will contact you soon.',
      };
    }

    return {
      error: 'Unknown tool',
      message: `Tool ${toolName} is not recognized`,
    };
  } catch (error) {
    console.error('Tool execution error:', { toolName, error });
    return {
      error: 'Tool execution failed',
      message: 'An error occurred while processing your request',
    };
  }
}

function extractTextContent(message: BedrockMessage): string {
  for (const content of message.content) {
    if ('text' in content) {
      return content.text;
    }
  }
  return '';
}

function extractToolUse(message: BedrockMessage): ToolUseBlock | null {
  for (const content of message.content) {
    if ('toolUse' in content) {
      return content.toolUse;
    }
  }
  return null;
}

/**
 * Main router for chat endpoints
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const { httpMethod, path } = event;

  // Handle CORS preflight
  if (httpMethod === 'OPTIONS') {
    return corsResponse();
  }

  try {
    if (httpMethod === 'POST' && path === '/chat') {
      return await handlePostChat(event);
    }

    if (httpMethod === 'GET' && path === '/chat/sessions') {
      return await handleGetSessions(event);
    }

    if (httpMethod === 'GET' && path.match(/^\/chat\/sessions\/[^/]+$/)) {
      return await handleGetSession(event);
    }

    if (httpMethod === 'DELETE' && path.match(/^\/chat\/sessions\/[^/]+$/)) {
      return await handleDeleteSession(event);
    }

    return error('Route not found', 'NOT_FOUND', 404);
  } catch (err) {
    console.error('Unhandled error:', err);
    return error('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
