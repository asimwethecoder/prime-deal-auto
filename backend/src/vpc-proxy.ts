/**
 * VPC Proxy Lambda
 * 
 * This Lambda runs inside the VPC and handles all database operations.
 * It's invoked synchronously by the main chat Lambda (which is outside the VPC).
 * 
 * Pattern: VPC Proxy Lambda (recommended by AWS serverless experts)
 * - Main Lambda (no VPC) → VPC Proxy Lambda (VPC) → Aurora
 * - Avoids NAT Gateway costs (~$33-70/month)
 * - Minimal additional cost (~$0-2/month for extra invocations)
 */

import { getChatSessionRepository } from './repositories/chat-session.repository';
import { getChatMessageRepository } from './repositories/chat-message.repository';
import { getLeadRepository } from './repositories/lead.repository';

const sessionRepository = getChatSessionRepository();
const messageRepository = getChatMessageRepository();
const leadRepository = getLeadRepository();

export interface VpcProxyEvent {
  operation: string;
  params: Record<string, any>;
}

export interface VpcProxyResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export async function handler(event: VpcProxyEvent): Promise<VpcProxyResponse> {
  try {
    console.log('VPC Proxy operation:', event.operation);

    switch (event.operation) {
      // Session operations
      case 'session:findById':
        return { success: true, data: await sessionRepository.findById(event.params.id) };

      case 'session:findByToken':
        return { success: true, data: await sessionRepository.findByToken(event.params.token) };

      case 'session:findByUserId':
        return { success: true, data: await sessionRepository.findByUserId(event.params.userId) };

      case 'session:create':
        return { success: true, data: await sessionRepository.create(event.params.token, event.params.userId) };

      case 'session:linkToUser':
        await sessionRepository.linkToUser(event.params.sessionId, event.params.userId);
        return { success: true };

      case 'session:touch':
        await sessionRepository.touch(event.params.sessionId);
        return { success: true };

      case 'session:delete':
        await sessionRepository.delete(event.params.sessionId);
        return { success: true };

      // Message operations
      case 'message:findBySessionId':
        return { 
          success: true, 
          data: await messageRepository.findBySessionId(event.params.sessionId, event.params.limit) 
        };

      case 'message:findLastBySessionId':
        return { 
          success: true, 
          data: await messageRepository.findLastBySessionId(event.params.sessionId) 
        };

      case 'message:create':
        return { success: true, data: await messageRepository.create(event.params as any) };

      // Lead operations
      case 'lead:create':
        return { success: true, data: await leadRepository.create(event.params as any) };

      case 'lead:findById':
        return { success: true, data: await leadRepository.findById(event.params.id) };

      // Car operations (for tool execution)
      case 'car:listCars': {
        const { CarService } = await import('./services/cars.service');
        const carService = new CarService();
        return { success: true, data: await carService.listCars(event.params) };
      }

      case 'car:getById': {
        const { CarService } = await import('./services/cars.service');
        const carService = new CarService();
        return { success: true, data: await carService.getCarById(event.params.id) };
      }

      default:
        return { success: false, error: `Unknown operation: ${event.operation}` };
    }
  } catch (error) {
    console.error('VPC Proxy error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
