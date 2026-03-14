// Leads API Module
// Contact form submissions

import { post } from './client';

export interface CreateLeadPayload {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  whatsAppNumber?: string;
  subject?: string;
  enquiry?: string;
  carId?: string;
}

export interface CreateLeadResponse {
  id: string;
}

/**
 * Submit a lead (contact form) to the API
 */
export async function createLead(
  payload: CreateLeadPayload
): Promise<CreateLeadResponse> {
  return post<CreateLeadResponse>('/leads', payload);
}
