/**
 * VPC Proxy Client
 * 
 * Client for invoking the VPC Proxy Lambda from the main chat Lambda.
 * Uses synchronous invocation (RequestResponse) to wait for results.
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const lambda = new LambdaClient({});

export interface VpcProxyRequest {
  operation: string;
  params: Record<string, any>;
}

export interface VpcProxyResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Invoke the VPC Proxy Lambda synchronously
 */
export async function invokeVpcProxy(request: VpcProxyRequest): Promise<any> {
  const functionName = process.env.VPC_PROXY_FUNCTION_NAME;
  
  if (!functionName) {
    throw new Error('VPC_PROXY_FUNCTION_NAME environment variable not set');
  }

  try {
    const command = new InvokeCommand({
      FunctionName: functionName,
      InvocationType: 'RequestResponse', // Synchronous invocation
      Payload: JSON.stringify(request),
    });

    const response = await lambda.send(command);

    if (!response.Payload) {
      throw new Error('No payload returned from VPC Proxy');
    }

    const result: VpcProxyResponse = JSON.parse(
      new TextDecoder().decode(response.Payload)
    );

    if (!result.success) {
      throw new Error(result.error || 'VPC Proxy operation failed');
    }

    return result.data;
  } catch (error) {
    console.error('VPC Proxy invocation error:', error);
    throw error;
  }
}

/**
 * Session operations
 */
export const sessionProxy = {
  findById: (id: string) => invokeVpcProxy({ operation: 'session:findById', params: { id } }),
  findByToken: (token: string) => invokeVpcProxy({ operation: 'session:findByToken', params: { token } }),
  findByUserId: (userId: string) => invokeVpcProxy({ operation: 'session:findByUserId', params: { userId } }),
  create: (token: string, userId?: string) => invokeVpcProxy({ operation: 'session:create', params: { token, userId } }),
  linkToUser: (sessionId: string, userId: string) => invokeVpcProxy({ operation: 'session:linkToUser', params: { sessionId, userId } }),
  touch: (sessionId: string) => invokeVpcProxy({ operation: 'session:touch', params: { sessionId } }),
  delete: (sessionId: string) => invokeVpcProxy({ operation: 'session:delete', params: { sessionId } }),
};

/**
 * Message operations
 */
export const messageProxy = {
  findBySessionId: (sessionId: string, limit?: number) => 
    invokeVpcProxy({ operation: 'message:findBySessionId', params: { sessionId, limit } }),
  findLastBySessionId: (sessionId: string) => 
    invokeVpcProxy({ operation: 'message:findLastBySessionId', params: { sessionId } }),
  create: (params: any) => invokeVpcProxy({ operation: 'message:create', params }),
};

/**
 * Lead operations
 */
export const leadProxy = {
  create: (params: any) => invokeVpcProxy({ operation: 'lead:create', params }),
  findById: (id: string) => invokeVpcProxy({ operation: 'lead:findById', params: { id } }),
};

/**
 * Car operations
 */
export const carProxy = {
  listCars: (params: any) => invokeVpcProxy({ operation: 'car:listCars', params }),
  getById: (id: string) => invokeVpcProxy({ operation: 'car:getById', params: { id } }),
};
