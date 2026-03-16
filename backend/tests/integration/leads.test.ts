/**
 * Integration Tests: Leads Operations
 * 
 * Tests for POST /leads (public enquiry submission)
 */

import { describe, it, expect } from 'vitest';
import {
  TEST_LEADS,
  createMockEvent,
  expectSuccess,
  expectError,
} from './test-fixtures';
import { handleCreateLead } from '../../src/handlers/leads.handler';

describe('Leads Operations', () => {
  // ============================================
  // POST /leads - Create Lead (Public)
  // ============================================
  describe('POST /leads - Create Lead', () => {
    it('creates lead with full data', async () => {
      const event = createMockEvent({
        httpMethod: 'POST',
        path: '/leads',
        body: JSON.stringify(TEST_LEADS.validLead),
      });

      const result = await handleCreateLead(event);

      expect(result.statusCode).toBe(201);
      const data = expectSuccess<any>(result.body);
      
      expect(data).toHaveProperty('id');
      expect(typeof data.id).toBe('string');
    });

    it('creates lead with minimal data (email only)', async () => {
      const event = createMockEvent({
        httpMethod: 'POST',
        path: '/leads',
        body: JSON.stringify(TEST_LEADS.minimalLead),
      });

      const result = await handleCreateLead(event);

      expect(result.statusCode).toBe(201);
      const data = expectSuccess<any>(result.body);
      
      expect(data).toHaveProperty('id');
    });

    it('creates lead with car reference', async () => {
      const event = createMockEvent({
        httpMethod: 'POST',
        path: '/leads',
        body: JSON.stringify({
          ...TEST_LEADS.validLead,
          carId: '00000000-0000-0000-0000-000000000001', // Test car ID
        }),
      });

      const result = await handleCreateLead(event);

      expect(result.statusCode).toBe(201);
      const data = expectSuccess<any>(result.body);
      
      expect(data).toHaveProperty('id');
    });

    it('returns 400 when email is missing', async () => {
      const event = createMockEvent({
        httpMethod: 'POST',
        path: '/leads',
        body: JSON.stringify(TEST_LEADS.missingEmail),
      });

      const result = await handleCreateLead(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

    it('returns 400 when email is invalid', async () => {
      const event = createMockEvent({
        httpMethod: 'POST',
        path: '/leads',
        body: JSON.stringify(TEST_LEADS.invalidEmail),
      });

      const result = await handleCreateLead(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

    it('returns 400 when email is empty string', async () => {
      const event = createMockEvent({
        httpMethod: 'POST',
        path: '/leads',
        body: JSON.stringify({ email: '' }),
      });

      const result = await handleCreateLead(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

    it('returns 400 when email is whitespace only', async () => {
      const event = createMockEvent({
        httpMethod: 'POST',
        path: '/leads',
        body: JSON.stringify({ email: '   ' }),
      });

      const result = await handleCreateLead(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

    it('returns 400 when body is missing', async () => {
      const event = createMockEvent({
        httpMethod: 'POST',
        path: '/leads',
        body: null,
      });

      const result = await handleCreateLead(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

    it('returns 400 when body is invalid JSON', async () => {
      const event = createMockEvent({
        httpMethod: 'POST',
        path: '/leads',
        body: 'not valid json',
      });

      const result = await handleCreateLead(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

    it('trims whitespace from email', async () => {
      const event = createMockEvent({
        httpMethod: 'POST',
        path: '/leads',
        body: JSON.stringify({
          email: '  test@example.com  ',
        }),
      });

      const result = await handleCreateLead(event);

      expect(result.statusCode).toBe(201);
      const data = expectSuccess<any>(result.body);
      
      expect(data).toHaveProperty('id');
    });

    it('handles South African phone format', async () => {
      const event = createMockEvent({
        httpMethod: 'POST',
        path: '/leads',
        body: JSON.stringify({
          email: 'test@example.com',
          phone: '+27821234567',
        }),
      });

      const result = await handleCreateLead(event);

      expect(result.statusCode).toBe(201);
      const data = expectSuccess<any>(result.body);
      
      expect(data).toHaveProperty('id');
    });

    it('handles local phone format', async () => {
      const event = createMockEvent({
        httpMethod: 'POST',
        path: '/leads',
        body: JSON.stringify({
          email: 'test@example.com',
          phone: '0821234567',
        }),
      });

      const result = await handleCreateLead(event);

      expect(result.statusCode).toBe(201);
      const data = expectSuccess<any>(result.body);
      
      expect(data).toHaveProperty('id');
    });

    it('returns 405 for non-POST methods', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/leads',
      });

      const result = await handleCreateLead(event);

      expect(result.statusCode).toBe(405);
    });
  });
});
