/**
 * Unit Tests: Cars Handler
 * 
 * Tests handler logic with mocked services/repositories
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockEvent,
  createAdminEvent,
  createUserEvent,
  expectSuccess,
  expectError,
} from '../../integration/test-fixtures';

// Use vi.hoisted to create mock functions that can be referenced in vi.mock
const { mockListCars, mockGetCarById, mockCreateCar, mockUpdateCar, mockDeleteCar } = vi.hoisted(() => ({
  mockListCars: vi.fn(),
  mockGetCarById: vi.fn(),
  mockCreateCar: vi.fn(),
  mockUpdateCar: vi.fn(),
  mockDeleteCar: vi.fn(),
}));

// Mock the cars service module
vi.mock('../../../src/services/cars.service', () => ({
  CarService: vi.fn().mockImplementation(() => ({
    listCars: mockListCars,
    getCarById: mockGetCarById,
    createCar: mockCreateCar,
    updateCar: mockUpdateCar,
    deleteCar: mockDeleteCar,
  })),
}));

// Import after mocking
import {
  handleGetCars,
  handleGetCarById,
  handleCreateCar,
  handleUpdateCar,
  handleDeleteCar,
} from '../../../src/handlers/cars.handler';

describe('Cars Handler - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up default mock implementations
    mockListCars.mockResolvedValue({
      cars: [
        { id: 'car-1', make: 'Toyota', model: 'Corolla', year: 2023, price: '389000', status: 'active' },
        { id: 'car-2', make: 'BMW', model: 'X5', year: 2022, price: '1250000', status: 'active' },
      ],
      total: 2,
      page: 1,
      limit: 20,
      hasMore: false,
    });
    
    mockGetCarById.mockImplementation(async (id: string) => {
      if (id === 'car-1') {
        return { id: 'car-1', make: 'Toyota', model: 'Corolla', year: 2023, price: '389000', images: [] };
      }
      return null;
    });
    
    mockCreateCar.mockResolvedValue({
      id: 'car-new',
      make: 'Toyota',
      model: 'Corolla',
      year: 2023,
      price: '389000',
    });
    
    mockUpdateCar.mockImplementation(async (id: string, data: any) => {
      if (id === 'car-1') {
        return { id: 'car-1', ...data };
      }
      return null;
    });
    
    mockDeleteCar.mockResolvedValue(true);
  });

  describe('GET /cars', () => {
    it('returns paginated list of cars', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/cars',
      });

      const result = await handleGetCars(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<any>(result.body);
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('page');
      expect(data).toHaveProperty('limit');
    });
  });

  describe('GET /cars/:id', () => {
    it('returns 400 when carId is missing', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/cars/',
        pathParameters: null,
      });

      const result = await handleGetCarById(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });
  });

  describe('POST /cars - Auth', () => {
    it('returns 401 when not authenticated', async () => {
      const event = createMockEvent({
        httpMethod: 'POST',
        path: '/cars',
        body: JSON.stringify({ make: 'Toyota', model: 'Corolla', year: 2023, price: 389000 }),
      });

      const result = await handleCreateCar(event);

      expect(result.statusCode).toBe(401);
      expectError(result.body, 'UNAUTHORIZED');
    });

    it('returns 403 when not admin', async () => {
      const event = createUserEvent({
        httpMethod: 'POST',
        path: '/cars',
        body: JSON.stringify({ make: 'Toyota', model: 'Corolla', year: 2023, price: 389000 }),
      });

      const result = await handleCreateCar(event);

      expect(result.statusCode).toBe(403);
      expectError(result.body, 'FORBIDDEN');
    });
  });

  describe('POST /cars - Validation', () => {
    it('returns 400 when body is missing', async () => {
      const event = createAdminEvent({
        httpMethod: 'POST',
        path: '/cars',
        body: null,
      });

      const result = await handleCreateCar(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

    it('returns 400 when make is missing', async () => {
      const event = createAdminEvent({
        httpMethod: 'POST',
        path: '/cars',
        body: JSON.stringify({ model: 'Corolla', year: 2023, price: 389000 }),
      });

      const result = await handleCreateCar(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

    it('returns 400 when model is missing', async () => {
      const event = createAdminEvent({
        httpMethod: 'POST',
        path: '/cars',
        body: JSON.stringify({ make: 'Toyota', year: 2023, price: 389000 }),
      });

      const result = await handleCreateCar(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

    it('returns 400 when year is invalid', async () => {
      const event = createAdminEvent({
        httpMethod: 'POST',
        path: '/cars',
        body: JSON.stringify({ make: 'Toyota', model: 'Corolla', year: 1800, price: 389000 }),
      });

      const result = await handleCreateCar(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

    it('returns 400 when price is negative', async () => {
      const event = createAdminEvent({
        httpMethod: 'POST',
        path: '/cars',
        body: JSON.stringify({ make: 'Toyota', model: 'Corolla', year: 2023, price: -50000 }),
      });

      const result = await handleCreateCar(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

    it('returns 400 when condition is invalid', async () => {
      const event = createAdminEvent({
        httpMethod: 'POST',
        path: '/cars',
        body: JSON.stringify({ 
          make: 'Toyota', 
          model: 'Corolla', 
          year: 2023, 
          price: 389000,
          condition: 'invalid' 
        }),
      });

      const result = await handleCreateCar(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

    it('returns 400 when transmission is invalid', async () => {
      const event = createAdminEvent({
        httpMethod: 'POST',
        path: '/cars',
        body: JSON.stringify({ 
          make: 'Toyota', 
          model: 'Corolla', 
          year: 2023, 
          price: 389000,
          transmission: 'invalid' 
        }),
      });

      const result = await handleCreateCar(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

    it('returns 400 when fuel_type is invalid', async () => {
      const event = createAdminEvent({
        httpMethod: 'POST',
        path: '/cars',
        body: JSON.stringify({ 
          make: 'Toyota', 
          model: 'Corolla', 
          year: 2023, 
          price: 389000,
          fuel_type: 'invalid' 
        }),
      });

      const result = await handleCreateCar(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });
  });

  describe('PUT /cars/:id - Auth', () => {
    it('returns 401 when not authenticated', async () => {
      const event = createMockEvent({
        httpMethod: 'PUT',
        path: '/cars/car-1',
        pathParameters: { carId: 'car-1' },
        body: JSON.stringify({ price: 400000 }),
      });

      const result = await handleUpdateCar(event);

      expect(result.statusCode).toBe(401);
      expectError(result.body, 'UNAUTHORIZED');
    });

    it('returns 403 when not admin', async () => {
      const event = createUserEvent({
        httpMethod: 'PUT',
        path: '/cars/car-1',
        pathParameters: { carId: 'car-1' },
        body: JSON.stringify({ price: 400000 }),
      });

      const result = await handleUpdateCar(event);

      expect(result.statusCode).toBe(403);
      expectError(result.body, 'FORBIDDEN');
    });
  });

  describe('DELETE /cars/:id - Auth', () => {
    it('returns 401 when not authenticated', async () => {
      const event = createMockEvent({
        httpMethod: 'DELETE',
        path: '/cars/car-1',
        pathParameters: { carId: 'car-1' },
      });

      const result = await handleDeleteCar(event);

      expect(result.statusCode).toBe(401);
      expectError(result.body, 'UNAUTHORIZED');
    });

    it('returns 403 when not admin', async () => {
      const event = createUserEvent({
        httpMethod: 'DELETE',
        path: '/cars/car-1',
        pathParameters: { carId: 'car-1' },
      });

      const result = await handleDeleteCar(event);

      expect(result.statusCode).toBe(403);
      expectError(result.body, 'FORBIDDEN');
    });
  });
});
