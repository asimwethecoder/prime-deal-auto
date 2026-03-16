import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { success, error, paginated } from '../lib/response';
import { getLeadRepository, LeadFilters } from '../repositories/lead.repository';
import { getLeadNotesRepository } from '../repositories/lead-notes.repository';

const VALID_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'closed'];
const VALID_ENQUIRY_TYPES = ['general', 'test_drive', 'car_enquiry'];

function getAdminUserId(event: APIGatewayProxyEvent): string | undefined {
  return event.requestContext?.authorizer?.claims?.sub;
}

/**
 * GET /admin/leads - List leads with filters
 */
export async function handleGetLeads(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const params = event.queryStringParameters || {};
  
  const filters: LeadFilters = {
    status: params.status && VALID_STATUSES.includes(params.status) ? params.status : undefined,
    enquiryType: params.enquiryType && VALID_ENQUIRY_TYPES.includes(params.enquiryType) ? params.enquiryType : undefined,
    search: params.search?.trim() || undefined,
    dateFrom: params.dateFrom ? new Date(params.dateFrom) : undefined,
    dateTo: params.dateTo ? new Date(params.dateTo) : undefined,
    limit: Math.min(parseInt(params.limit || '20', 10), 100),
    offset: parseInt(params.offset || '0', 10),
  };

  try {
    const leadRepository = getLeadRepository();
    const { leads, total } = await leadRepository.findAllWithFilters(filters);
    const page = Math.floor((filters.offset || 0) / (filters.limit || 20)) + 1;
    return paginated(leads, total, page, filters.limit || 20);
  } catch (err) {
    console.error('Error fetching leads:', err);
    return error('Failed to fetch leads', 'INTERNAL_ERROR', 500);
  }
}


/**
 * GET /admin/leads/stats - Get lead statistics
 */
export async function handleGetLeadStats(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const leadRepository = getLeadRepository();
    const stats = await leadRepository.getStats();
    return success(stats);
  } catch (err) {
    console.error('Error fetching lead stats:', err);
    return error('Failed to fetch lead statistics', 'INTERNAL_ERROR', 500);
  }
}

/**
 * GET /admin/leads/:id - Get single lead with car details
 */
export async function handleGetLeadById(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const leadId = event.pathParameters?.id;
  if (!leadId) {
    return error('Lead ID is required', 'VALIDATION_ERROR', 400);
  }

  try {
    const leadRepository = getLeadRepository();
    const lead = await leadRepository.findByIdWithCar(leadId);
    if (!lead) {
      return error('Lead not found', 'NOT_FOUND', 404);
    }
    return success(lead);
  } catch (err) {
    console.error('Error fetching lead:', err);
    return error('Failed to fetch lead', 'INTERNAL_ERROR', 500);
  }
}

/**
 * PATCH /admin/leads/:id - Update lead status
 */
export async function handleUpdateLead(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const leadId = event.pathParameters?.id;
  if (!leadId) {
    return error('Lead ID is required', 'VALIDATION_ERROR', 400);
  }

  let body: { status?: string };
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return error('Invalid JSON body', 'VALIDATION_ERROR', 400);
  }

  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return error('Invalid status value', 'VALIDATION_ERROR', 400);
  }

  try {
    const leadRepository = getLeadRepository();
    const adminUserId = getAdminUserId(event);
    await leadRepository.updateStatus(leadId, body.status, adminUserId);
    return success({ id: leadId, status: body.status });
  } catch (err) {
    console.error('Error updating lead:', err);
    return error('Failed to update lead', 'INTERNAL_ERROR', 500);
  }
}


/**
 * DELETE /admin/leads/:id - Delete lead
 */
export async function handleDeleteLead(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const leadId = event.pathParameters?.id;
  if (!leadId) {
    return error('Lead ID is required', 'VALIDATION_ERROR', 400);
  }

  try {
    const leadRepository = getLeadRepository();
    await leadRepository.delete(leadId);
    return success({ deleted: true });
  } catch (err) {
    console.error('Error deleting lead:', err);
    return error('Failed to delete lead', 'INTERNAL_ERROR', 500);
  }
}

/**
 * GET /admin/leads/:id/notes - Get lead notes
 */
export async function handleGetLeadNotes(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const leadId = event.pathParameters?.id;
  if (!leadId) {
    return error('Lead ID is required', 'VALIDATION_ERROR', 400);
  }

  try {
    const notesRepository = getLeadNotesRepository();
    const notes = await notesRepository.findByLeadId(leadId);
    return success(notes);
  } catch (err) {
    console.error('Error fetching lead notes:', err);
    return error('Failed to fetch notes', 'INTERNAL_ERROR', 500);
  }
}

/**
 * POST /admin/leads/:id/notes - Add note to lead
 */
export async function handleAddLeadNote(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const leadId = event.pathParameters?.id;
  if (!leadId) {
    return error('Lead ID is required', 'VALIDATION_ERROR', 400);
  }

  let body: { noteText?: string };
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return error('Invalid JSON body', 'VALIDATION_ERROR', 400);
  }

  if (!body.noteText || typeof body.noteText !== 'string' || !body.noteText.trim()) {
    return error('Note text is required', 'VALIDATION_ERROR', 400);
  }

  try {
    const notesRepository = getLeadNotesRepository();
    const adminUserId = getAdminUserId(event);
    const noteId = await notesRepository.create({
      leadId,
      noteText: body.noteText.trim(),
      createdBy: adminUserId,
    });
    return success({ id: noteId }, 201);
  } catch (err) {
    console.error('Error adding note:', err);
    return error('Failed to add note', 'INTERNAL_ERROR', 500);
  }
}

/**
 * GET /admin/leads/:id/history - Get status history
 */
export async function handleGetLeadHistory(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const leadId = event.pathParameters?.id;
  if (!leadId) {
    return error('Lead ID is required', 'VALIDATION_ERROR', 400);
  }

  try {
    const leadRepository = getLeadRepository();
    const history = await leadRepository.getStatusHistory(leadId);
    return success(history);
  } catch (err) {
    console.error('Error fetching lead history:', err);
    return error('Failed to fetch history', 'INTERNAL_ERROR', 500);
  }
}
