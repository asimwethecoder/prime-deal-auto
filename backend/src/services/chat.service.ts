import { v4 as uuidv4 } from 'uuid';
import {
  getChatSessionRepository,
  ChatSessionRepository,
} from '../repositories/chat-session.repository';
import {
  getChatMessageRepository,
  ChatMessageRepository,
} from '../repositories/chat-message.repository';
import {
  ChatSession,
  ChatMessage,
  SendMessageParams,
  ChatResponse,
  SessionSummary,
  SessionDetail,
  BedrockMessage,
  ToolUseBlock,
  MessageContent,
} from '../types/chat.types';
import { converse, TOOL_DEFINITIONS, SYSTEM_PROMPT } from '../lib/bedrock';

export class ChatService {
  private sessionRepository: ChatSessionRepository;
  private messageRepository: ChatMessageRepository;

  constructor() {
    this.sessionRepository = getChatSessionRepository();
    this.messageRepository = getChatMessageRepository();
  }

  /**
   * Get or create a chat session
   */
  async getOrCreateSession(
    sessionId?: string,
    sessionToken?: string,
    userId?: string
  ): Promise<{ session: ChatSession; isNew: boolean }> {
    // Authenticated user with session_id
    if (userId && sessionId) {
      const session = await this.sessionRepository.findById(sessionId);
      if (!session || session.user_id !== userId) {
        throw new Error('FORBIDDEN: Session does not belong to user');
      }
      return { session, isNew: false };
    }

    // Authenticated user without session_id (create new)
    if (userId && !sessionId) {
      const newToken = uuidv4();
      const session = await this.sessionRepository.create(newToken, userId);
      return { session, isNew: true };
    }

    // Anonymous user with session_token
    if (sessionToken) {
      let session = await this.sessionRepository.findByToken(sessionToken);
      if (!session) {
        // Create session with provided token
        session = await this.sessionRepository.create(sessionToken);
      }
      return { session, isNew: !session };
    }

    // Anonymous user without session_token (create new)
    const newToken = uuidv4();
    const session = await this.sessionRepository.create(newToken);
    return { session, isNew: true };
  }

  /**
   * Link anonymous session to authenticated user
   */
  async linkAnonymousSession(sessionToken: string, userId: string): Promise<void> {
    const session = await this.sessionRepository.findByToken(sessionToken);
    if (session && !session.user_id) {
      await this.sessionRepository.linkToUser(session.id, userId);
    }
  }

  /**
   * Load conversation history from database
   */
  async loadConversationHistory(sessionId: string): Promise<BedrockMessage[]> {
    const messages = await this.messageRepository.findBySessionId(sessionId, 20);

    return messages.map((msg) => {
      if (msg.role === 'user') {
        // Check if this is a tool result message
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

        // Regular user message
        return {
          role: 'user',
          content: [{ text: msg.content }],
        };
      }

      if (msg.role === 'assistant') {
        // Check if this is a tool use message
        if (msg.metadata?.toolUse) {
          const content: MessageContent[] = [];
          
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

        // Regular assistant message
        return {
          role: 'assistant',
          content: [{ text: msg.content }],
        };
      }

      // System messages (shouldn't normally be in history)
      return {
        role: 'user' as const,
        content: [{ text: msg.content }],
      };
    });
  }

  /**
   * Persist a message to the database
   */
  async persistMessage(
    sessionId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: Record<string, any>
  ): Promise<ChatMessage> {
    const message = await this.messageRepository.create({
      sessionId,
      role,
      content,
      metadata,
    });

    // Update session timestamp
    await this.sessionRepository.touch(sessionId);

    return message;
  }

  /**
   * List all sessions for authenticated user
   */
  async listSessions(userId: string): Promise<SessionSummary[]> {
    const sessions = await this.sessionRepository.findByUserId(userId);

    const summaries: SessionSummary[] = [];
    for (const session of sessions) {
      const lastMessage = await this.messageRepository.findLastBySessionId(session.id);
      summaries.push({
        sessionId: session.id,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
        lastMessagePreview: lastMessage
          ? lastMessage.content.substring(0, 100)
          : '',
      });
    }

    return summaries;
  }

  /**
   * Get full session history
   */
  async getSession(
    sessionId: string,
    userId?: string,
    sessionToken?: string
  ): Promise<SessionDetail> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new Error('NOT_FOUND: Session not found');
    }

    // Authorization check
    if (userId && session.user_id !== userId) {
      throw new Error('FORBIDDEN: Session does not belong to user');
    }

    if (!userId && sessionToken && session.session_token !== sessionToken) {
      throw new Error('FORBIDDEN: Invalid session token');
    }

    const messages = await this.messageRepository.findBySessionId(sessionId);

    return {
      sessionId: session.id,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        createdAt: msg.created_at,
      })),
    };
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.sessionRepository.findById(sessionId);

    if (session && session.user_id !== userId) {
      throw new Error('FORBIDDEN: Session does not belong to user');
    }

    // Idempotent - don't throw if session doesn't exist
    if (session) {
      await this.sessionRepository.delete(sessionId);
    }
  }

  /**
   * Execute a tool requested by the AI assistant
   */
  async executeTool(toolName: string, input: Record<string, any>): Promise<any> {
    try {
      if (toolName === 'search_cars') {
        // Lazy import car service
        const { CarService } = await import('./cars.service');
        const carService = new CarService();

        const results = await carService.listCars({
          make: input.make,
          model: input.model,
          minPrice: input.minPrice,
          maxPrice: input.maxPrice,
          minYear: input.minYear,
          maxYear: input.maxYear,
          bodyType: input.bodyType,
          fuelType: input.fuelType,
          transmission: input.transmission,
          limit: 20, // Return up to 20 results
        });

        return {
          success: true,
          cars: results.cars.map((car) => ({
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
        const { CarService } = await import('./cars.service');
        const carService = new CarService();

        const car = await carService.getCarById(input.carId);

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
        // Validate country code format
        if (!input.countryCode || !input.countryCode.startsWith('+')) {
          return {
            error: 'Invalid country code',
            message: 'Country code must start with + (e.g., +27 for South Africa)',
          };
        }

        // Validate country is provided
        if (!input.country || input.country.trim().length === 0) {
          return {
            error: 'Missing country',
            message: 'Country is required',
          };
        }

        // Create lead using lead repository
        const { getLeadRepository } = require('../repositories/lead.repository');
        const leadRepository = getLeadRepository();

        const leadId = await leadRepository.create({
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

  /**
   * Execute the agent loop with Bedrock
   */
  async executeAgentLoop(
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

      // Log Bedrock interaction
      console.log('Bedrock interaction:', {
        iteration: iterations + 1,
        stopReason: response.stopReason,
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
      });

      if (response.stopReason === 'end_turn') {
        // Extract text response and return
        return this.extractTextContent(response.message);
      }

      if (response.stopReason === 'tool_use') {
        // Extract tool use block
        const toolUse = this.extractToolUse(response.message);

        if (!toolUse) {
          console.error('Failed to extract tool use from response');
          break;
        }

        // Execute the tool
        const toolResult = await this.executeTool(toolUse.name, toolUse.input);

        // Append assistant message with tool use
        messages.push(response.message);

        // Append user message with tool result
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

      // Unexpected stop reason
      console.warn('Unexpected stop reason:', response.stopReason);
      break;
    }

    // Max iterations reached or unexpected stop reason
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'assistant') {
      return this.extractTextContent(lastMessage);
    }

    return "I'm having trouble completing that request. Please try rephrasing.";
  }

  /**
   * Extract text content from a Bedrock message
   */
  private extractTextContent(message: BedrockMessage): string {
    for (const content of message.content) {
      if ('text' in content) {
        return content.text;
      }
    }
    return '';
  }

  /**
   * Extract tool use block from a Bedrock message
   */
  private extractToolUse(message: BedrockMessage): ToolUseBlock | null {
    for (const content of message.content) {
      if ('toolUse' in content) {
        return content.toolUse;
      }
    }
    return null;
  }

  /**
   * Send a message and get AI response
   */
  async sendMessage(params: SendMessageParams): Promise<ChatResponse> {
    // Get or create session
    const { session, isNew } = await this.getOrCreateSession(
      params.sessionId,
      params.sessionToken,
      params.userId
    );

    // Load conversation history
    const conversationHistory = await this.loadConversationHistory(session.id);

    // Execute agent loop
    const assistantResponse = await this.executeAgentLoop(
      params.message,
      conversationHistory
    );

    // Persist user message
    await this.persistMessage(session.id, 'user', params.message);

    // Persist assistant response
    await this.persistMessage(session.id, 'assistant', assistantResponse);

    return {
      sessionId: session.id,
      sessionToken: session.user_id ? undefined : session.session_token,
      message: assistantResponse,
      createdAt: new Date().toISOString(),
    };
  }
}

// Singleton instance
let chatServiceInstance: ChatService | null = null;

export function getChatService(): ChatService {
  if (!chatServiceInstance) {
    chatServiceInstance = new ChatService();
  }
  return chatServiceInstance;
}
