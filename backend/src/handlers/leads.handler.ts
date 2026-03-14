import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { success, error } from '../lib/response';
import { getLeadRepository } from '../repositories/lead.repository';

interface CreateLeadBody {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  enquiry?: string;
  carId?: string;
}

function isValidEmail(value: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

export async function handleCreateLead(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  if (event.httpMethod !== 'POST') {
    return error('Method not allowed', 'INTERNAL_ERROR', 405);
  }

  let body: CreateLeadBody;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return error('Invalid JSON body', 'VALIDATION_ERROR', 400);
  }

  const { firstName, lastName, email, phone, enquiry, carId } = body;

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    return error('Email is required', 'VALIDATION_ERROR', 400);
  }

  const trimmedEmail = email.trim();
  if (!isValidEmail(trimmedEmail)) {
    return error('Invalid email format', 'VALIDATION_ERROR', 400);
  }

  const leadRepository = getLeadRepository();

  try {
    const id = await leadRepository.create({
      firstName: typeof firstName === 'string' ? firstName.trim() || undefined : undefined,
      lastName: typeof lastName === 'string' ? lastName.trim() || undefined : undefined,
      email: trimmedEmail,
      phone: typeof phone === 'string' ? phone.trim() || undefined : undefined,
      enquiry: typeof enquiry === 'string' ? enquiry.trim() || undefined : undefined,
      carId: typeof carId === 'string' && carId.trim() ? carId.trim() : undefined,
      source: 'website',
      country: 'ZA',
    });

    return success({ id }, 201);
  } catch (err) {
    console.error('Lead creation error:', err);
    return error('Failed to submit enquiry', 'INTERNAL_ERROR', 500);
  }
}
