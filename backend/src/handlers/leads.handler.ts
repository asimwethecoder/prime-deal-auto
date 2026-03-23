import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { success, error } from '../lib/response';
import { getLeadRepository } from '../repositories/lead.repository';
import { sendLeadNotification } from '../services/email.service';
import { getPool } from '../lib/database';

interface CreateLeadBody {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  whatsappNumber?: string;
  whatsAppNumber?: string;
  subject?: string;
  enquiry?: string;
  carId?: string;
  enquiryType?: 'general' | 'test_drive' | 'car_enquiry';
  source?: string;
}

function isValidEmail(value: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

const VALID_ENQUIRY_TYPES = ['general', 'test_drive', 'car_enquiry'];

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

  const { firstName, lastName, email, phone, whatsappNumber, whatsAppNumber, subject, enquiry, carId, enquiryType, source } = body;
  const resolvedWhatsApp = whatsappNumber || whatsAppNumber;

  // Validate email
  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    return error('Email is required', 'VALIDATION_ERROR', 400);
  }
  const trimmedEmail = email.trim();
  if (!isValidEmail(trimmedEmail)) {
    return error('Invalid email format', 'VALIDATION_ERROR', 400);
  }

  // Validate enquiry type if provided
  const validEnquiryType = enquiryType && VALID_ENQUIRY_TYPES.includes(enquiryType) 
    ? enquiryType as 'general' | 'test_drive' | 'car_enquiry'
    : 'general';


  const leadRepository = getLeadRepository();

  try {
    // Create the lead
    const id = await leadRepository.create({
      firstName: typeof firstName === 'string' ? firstName.trim() || undefined : undefined,
      lastName: typeof lastName === 'string' ? lastName.trim() || undefined : undefined,
      email: trimmedEmail,
      phone: typeof phone === 'string' ? phone.trim() || undefined : undefined,
      whatsappNumber: typeof resolvedWhatsApp === 'string' ? resolvedWhatsApp.trim() || undefined : undefined,
      subject: typeof subject === 'string' ? subject.trim() || undefined : undefined,
      enquiry: typeof enquiry === 'string' ? enquiry.trim() || undefined : undefined,
      carId: typeof carId === 'string' && carId.trim() ? carId.trim() : undefined,
      source: typeof source === 'string' ? source.trim() : 'website',
      enquiryType: validEnquiryType,
      country: 'ZA',
    });

    // Fetch car details if carId provided (for email)
    let carDetails: { id: string; year: number; make: string; model: string; variant?: string; price: number } | undefined;
    if (carId) {
      try {
        const pool = await getPool();
        const carResult = await pool.query(
          'SELECT id, year, make, model, variant, price FROM cars WHERE id = $1',
          [carId]
        );
        if (carResult.rows.length > 0) {
          const car = carResult.rows[0];
          carDetails = {
            id: car.id,
            year: car.year,
            make: car.make,
            model: car.model,
            variant: car.variant,
            price: parseFloat(car.price),
          };
        }
      } catch (carErr) {
        console.error('Failed to fetch car details for email:', carErr);
      }
    }

    // Send email notification (don't block on failure)
    try {
      const leadData = {
        id,
        first_name: firstName?.trim(),
        last_name: lastName?.trim(),
        email: trimmedEmail,
        phone: phone?.trim(),
        whatsapp_number: resolvedWhatsApp?.trim(),
        subject: subject?.trim(),
        enquiry: enquiry?.trim(),
        enquiry_type: validEnquiryType,
        source: source || 'website',
        status: 'new' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await sendLeadNotification(leadData, carDetails);
    } catch (emailErr) {
      console.error('Failed to send lead notification email:', emailErr);
      // Continue - email failure should not block lead creation
    }

    return success({ id }, 201);
  } catch (err) {
    console.error('Lead creation error:', err);
    return error('Failed to submit enquiry', 'INTERNAL_ERROR', 500);
  }
}
