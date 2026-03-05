import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getChatService } from '../services/chat.service';
import { getRateLimiter } from '../lib/rate-limiter';
import { PostChatSchema } from '../types/chat.types';
import { success, error } from '../lib/response';

const chatService = getChatService();
const rateLimiter = getRateLimiter();

/**
 * POST /chat - Send a message and get AI response
 */
export async function handlePostChat(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    // Debug log
    console.log('POST /chat - event.body:', event.body);
    console.log('POST /chat - event.body type:', typeof event.body);
    
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

    // Get or create session for rate limiting
    const { session } = await chatService.getOrCreateSession(
      sessionId,
      sessionToken,
      userId
    );

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

    // Send message and get response
    const response = await chatService.sendMessage({
      message,
      sessionId,
      sessionToken,
      userId,
    });

    return success(response);
  } catch (err) {
    console.error('POST /chat error:', err);

    // Handle JSON parsing errors
    if (err instanceof SyntaxError) {
      return error('Invalid JSON in request body', 'VALIDATION_ERROR', 400);
    }

    // Handle specific error types
    if (err instanceof Error) {
      if (err.message.startsWith('FORBIDDEN:')) {
        return error(err.message.replace('FORBIDDEN: ', ''), 'FORBIDDEN', 403);
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
    // Require authentication
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return error('Authentication required', 'UNAUTHORIZED', 401);
    }

    const sessions = await chatService.listSessions(userId);

    return success(sessions);
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
    if (!sessionId) {
      return error('Session ID is required', 'VALIDATION_ERROR', 400);
    }

    // Extract userId from JWT if authenticated
    const userId = event.requestContext.authorizer?.claims?.sub;

    // Extract sessionToken from query params if anonymous
    const sessionToken = event.queryStringParameters?.sessionToken;

    const session = await chatService.getSession(sessionId, userId, sessionToken);

    return success(session);
  } catch (err) {
    console.error('GET /chat/sessions/:id error:', err);

    if (err instanceof Error) {
      if (err.message.startsWith('NOT_FOUND:')) {
        return error(err.message.replace('NOT_FOUND: ', ''), 'NOT_FOUND', 404);
      }
      if (err.message.startsWith('FORBIDDEN:')) {
        return error(err.message.replace('FORBIDDEN: ', ''), 'FORBIDDEN', 403);
      }
    }

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
    // Require authentication
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return error('Authentication required', 'UNAUTHORIZED', 401);
    }

    const sessionId = event.pathParameters?.id;
    if (!sessionId) {
      return error('Session ID is required', 'VALIDATION_ERROR', 400);
    }

    await chatService.deleteSession(sessionId, userId);

    return success({ message: 'Session deleted successfully' });
  } catch (err) {
    console.error('DELETE /chat/sessions/:id error:', err);

    if (err instanceof Error) {
      if (err.message.startsWith('FORBIDDEN:')) {
        return error(err.message.replace('FORBIDDEN: ', ''), 'FORBIDDEN', 403);
      }
    }

    return error('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
