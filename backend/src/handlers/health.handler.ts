import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { success } from '../lib/response';

export async function handleHealth(
  _event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  return success({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
