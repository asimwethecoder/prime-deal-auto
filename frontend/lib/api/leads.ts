// Leads API Module
// Contact form submissions and admin lead management

import { get, post, patch, del } from './client';

export interface CreateLeadPayload {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  whatsAppNumber?: string;
  subject?: string;
  enquiry?: string;
  carId?: string;
  enquiryType?: 'general' | 'test_drive' | 'car_enquiry';
  source?: string;
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

// ============================================================================
// Admin Lead Management Types
// ============================================================================

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
export type EnquiryType = 'general' | 'test_drive' | 'car_enquiry';

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  whatsapp_number?: string;
  subject?: string;
  enquiry: string;
  car_id?: string;
  enquiry_type: EnquiryType;
  source?: string;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
}

export interface LeadCar {
  id: string;
  make: string;
  model: string;
  variant?: string;
  year: number;
  price: number;
  primary_image_url?: string;
}

export interface LeadWithCar extends Lead {
  car?: LeadCar;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  note: string;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
}

export interface LeadStatusHistory {
  id: string;
  lead_id: string;
  old_status?: LeadStatus;
  new_status: LeadStatus;
  changed_by?: string;
  changed_by_name?: string;
  changed_at: string;
}

export interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  qualified: number;
  converted: number;
  closed: number;
}

export interface LeadFilters {
  status?: LeadStatus;
  enquiryType?: EnquiryType;
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface PaginatedLeads {
  data: LeadWithCar[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================================================
// Admin Lead Management API Functions
// ============================================================================

/**
 * Get paginated list of leads with filters (admin only)
 */
export async function getLeads(filters?: LeadFilters): Promise<PaginatedLeads> {
  const params: Record<string, string | number> = {};
  
  if (filters?.status) params.status = filters.status;
  if (filters?.enquiryType) params.enquiryType = filters.enquiryType;
  if (filters?.search) params.search = filters.search;
  if (filters?.startDate) params.startDate = filters.startDate;
  if (filters?.endDate) params.endDate = filters.endDate;
  if (filters?.limit) params.limit = filters.limit;
  if (filters?.offset) params.offset = filters.offset;

  return get<PaginatedLeads>('/admin/leads', params);
}

/**
 * Get lead statistics for dashboard (admin only)
 */
export async function getLeadStats(): Promise<LeadStats> {
  return get<LeadStats>('/admin/leads/stats');
}

/**
 * Get a single lead by ID with car details (admin only)
 */
export async function getLeadById(id: string): Promise<LeadWithCar> {
  return get<LeadWithCar>(`/admin/leads/${id}`);
}

/**
 * Update lead status (admin only)
 */
export async function updateLeadStatus(
  id: string,
  status: LeadStatus
): Promise<LeadWithCar> {
  return patch<LeadWithCar>(`/admin/leads/${id}`, { status });
}

/**
 * Delete a lead (admin only)
 */
export async function deleteLead(id: string): Promise<void> {
  return del<void>(`/admin/leads/${id}`);
}

/**
 * Get notes for a lead (admin only)
 */
export async function getLeadNotes(leadId: string): Promise<LeadNote[]> {
  return get<LeadNote[]>(`/admin/leads/${leadId}/notes`);
}

/**
 * Add a note to a lead (admin only)
 */
export async function addLeadNote(
  leadId: string,
  note: string
): Promise<LeadNote> {
  return post<LeadNote>(`/admin/leads/${leadId}/notes`, { note });
}

/**
 * Get status history for a lead (admin only)
 */
export async function getLeadHistory(leadId: string): Promise<LeadStatusHistory[]> {
  return get<LeadStatusHistory[]>(`/admin/leads/${leadId}/history`);
}
