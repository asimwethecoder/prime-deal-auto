/**
 * Integration Tests: Cars CRUD Operations
 * 
 * Tests for GET /cars, GET /cars/:id, POST /cars, PUT /cars/:id, DELETE /cars/:id
 * 
 * Run with: npm run test:integration
 * Requires database connection (set DATABASE_URL or SECRET_ARN + DB_HOST)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  TEST_CARS,
  createMockEvent,
  createAdminEvent,
  createUserEvent,
  expectSuccess,
  expectError,
  PaginatedResponse,
} from './test-fixtures';
import {
  handleGetCars,
  handleGetCarById,
  handleCreateCar,
  handleUpdateCar,
  handleDeleteCar,
} from '../../src/handlers/cars.handler';

// Store created car IDs for cleanup
const createdCarIds: string[] = [];

describe('Cars CRUD Operations', () => {
  // ============================================
  // GET /cars - List Cars
  // ============================================
  describe('GET /cars - List Cars', () => {
    it('returns paginated list of active cars', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/cars',
      });

      const result = await handleGetCars(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<PaginatedResponse<any>>(result.body);
      
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('page');
      expect(data).toHaveProperty('limit');
      expect(data).toHaveProperty('hasMore');
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.page).toBeGreaterThanOrEqual(1);
      expect(data.limit).toBeGreaterThan(0);
    });

    it('respects limit and offset pagination', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/cars',
        queryStringParameters: {
          limit: '5',
          offset: '0',
        },
      });

      const result = await handleGetCars(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<PaginatedResponse<any>>(result.body);
      
      expect(data.limit).toBe(5);
      expect(data.data.length).toBeLessThanOrEqual(5);
    });

    it('filters by make', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/cars',
        queryStringParameters: {
          make: 'Toyota',
        },
      });

      const result = await handleGetCars(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<PaginatedResponse<any>>(result.body);
      
      // All returned cars should be Toyota
      data.data.forEach((car: any) => {
        expect(car.make.toLowerCase()).toBe('toyota');
      });
    });

    it('filters by price range', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/cars',
        queryStringParameters: {
          minPrice: '200000',
          maxPrice: '500000',
        },
      });

      const result = await handleGetCars(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<PaginatedResponse<any>>(result.body);
      
      // All returned cars should be within price range
      data.data.forEach((car: any) => {
        expect(parseFloat(car.price)).toBeGreaterThanOrEqual(200000);
        expect(parseFloat(car.price)).toBeLessThanOrEqual(500000);
      });
    });

    it('filters by year range', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/cars',
        queryStringParameters: {
          minYear: '2022',
          maxYear: '2023',
        },
      });

      const result = await handleGetCars(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<PaginatedResponse<any>>(result.body);
      
      data.data.forEach((car: any) => {
        expect(car.year).toBeGreaterThanOrEqual(2022);
        expect(car.year).toBeLessThanOrEqual(2023);
      });
    });

    it('filters by transmission type', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/cars',
        queryStringParameters: {
          transmission: 'automatic',
        },
      });

      const result = await handleGetCars(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<PaginatedResponse<any>>(result.body);
      
      data.data.forEach((car: any) => {
        expect(car.transmission).toBe('automatic');
      });
    });

    it('filters by fuel type', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/cars',
        queryStringParameters: {
          fuelType: 'diesel',
        },
      });

      const result = await handleGetCars(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<PaginatedResponse<any>>(result.body);
      
      data.data.forEach((car: any) => {
        expect(car.fuel_type).toBe('diesel');
      });
    });

    it('sorts by price ascending', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/cars',
        queryStringParameters: {
          sortBy: 'price',
          sortOrder: 'asc',
          limit: '10',
        },
      });

      const result = await handleGetCars(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<PaginatedResponse<any>>(result.body);
      
      // Verify ascending order
      for (let i = 1; i < data.data.length; i++) {
        expect(parseFloat(data.data[i].price)).toBeGreaterThanOrEqual(
          parseFloat(data.data[i - 1].price)
        );
      }
    });

    it('sorts by year descending', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/cars',
        queryStringParameters: {
          sortBy: 'year',
          sortOrder: 'desc',
          limit: '10',
        },
      });

      const result = await handleGetCars(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<PaginatedResponse<any>>(result.body);
      
      // Verify descending order
      for (let i = 1; i < data.data.length; i++) {
        expect(data.data[i].year).toBeLessThanOrEqual(data.data[i - 1].year);
      }
    });

    it('does not return deleted cars for public queries', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/cars',
      });

      const result = await handleGetCars(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<PaginatedResponse<any>>(result.body);
      
      // No deleted cars should be returned
      data.data.forEach((car: any) => {
        expect(car.status).not.toBe('deleted');
      });
    });

    it('admin can filter by status', async () => {
      const event = createAdminEvent({
        httpMethod: 'GET',
        path: '/cars',
        queryStringParameters: {
          status: 'all',
        },
      });

      const result = await handleGetCars(event);

      expect(result.statusCode).toBe(200);
      // Admin should be able to see all statuses
    });
  });

  // ============================================
  // GET /cars/:id - Get Single Car
  // ============================================
  describe('GET /cars/:id - Get Single Car', () => {
    it('returns car with images when found', async () => {
      // First get a car ID from the list
      const listEvent = createMockEvent({
        httpMethod: 'GET',
        path: '/cars',
        queryStringParameters: { limit: '1' },
      });
      const listResult = await handleGetCars(listEvent);
      const listData = expectSuccess<PaginatedResponse<any>>(listResult.body);
      
      if (listData.data.length === 0) {
        console.log('No cars in database, skipping test');
        return;
      }

      const carId = listData.data[0].id;

      const event = createMockEvent({
        httpMethod: 'GET',
        path: `/cars/${carId}`,
        pathParameters: { carId },
      });

      const result = await handleGetCarById(event);

      expect(result.statusCode).toBe(200);
      const car = expectSuccess<any>(result.body);
      
      expect(car.id).toBe(carId);
      expect(car).toHaveProperty('make');
      expect(car).toHaveProperty('model');
      expect(car).toHaveProperty('year');
      expect(car).toHaveProperty('price');
      expect(car).toHaveProperty('images');
      expect(Array.isArray(car.images)).toBe(true);
    });

    it('returns 404 for non-existent car', async () => {
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/cars/00000000-0000-0000-0000-000000000000',
        pathParameters: { carId: '00000000-0000-0000-0000-000000000000' },
      });

      const result = await handleGetCarById(event);

      expect(result.statusCode).toBe(404);
      expectError(result.body, 'NOT_FOUND');
    });

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

  // ============================================
  // POST /cars - Create Car (Admin Only)
  // ============================================
  describe('POST /cars - Create Car', () => {
    it('creates car with valid data when admin', async () => {
      const carData = TEST_CARS.toyotaCorolla;
      
      const event = createAdminEvent({
        httpMethod: 'POST',
        path: '/cars',
        body: JSON.stringify(carData),
      });

      const result = await handleCreateCar(event);

      expect(result.statusCode).toBe(201);
      const car = expectSuccess<any>(result.body);
      
      expect(car).toHaveProperty('id');
      expect(car.make).toBe(carData.make);
      expect(car.model).toBe(carData.model);
      expect(car.year).toBe(carData.year);
      expect(parseFloat(car.price)).toBe(carData.price);
      expect(car.transmission).toBe(carData.transmission);
      expect(car.fuel_type).toBe(carData.fuel_type);
      expect(car.condition).toBe(carData.condition);

      // Store for cleanup
      createdCarIds.push(car.id);
    });

    it('returns 401 when not authenticated', async () => {
      const event = createMockEvent({
        httpMethod: 'POST',
        path: '/cars',
        body: JSON.stringify(TEST_CARS.toyotaCorolla),
      });

      const result = await handleCreateCar(event);

      expect(result.statusCode).toBe(401);
      expectError(result.body, 'UNAUTHORIZED');
    });

    it('returns 403 when authenticated but not admin', async () => {
      const event = createUserEvent({
        httpMethod: 'POST',
        path: '/cars',
        body: JSON.stringify(TEST_CARS.toyotaCorolla),
      });

      const result = await handleCreateCar(event);

      expect(result.statusCode).toBe(403);
      expectError(result.body, 'FORBIDDEN');
    });

    it('returns 400 when make is missing', async () => {
      const { make, ...carWithoutMake } = TEST_CARS.toyotaCorolla;
      
      const event = createAdminEvent({
        httpMethod: 'POST',
        path: '/cars',
        body: JSON.stringify(carWithoutMake),
      });

      const result = await handleCreateCar(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

    it('returns 400 when model is missing', async () => {
      const { model, ...carWithoutModel } = TEST_CARS.toyotaCorolla;
      
      const event = createAdminEvent({
        httpMethod: 'POST',
        path: '/cars',
        body: JSON.stringify(carWithoutModel),
      });

      const result = await handleCreateCar(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

    it('returns 400 when year is invalid', async () => {
      const event = createAdminEvent({
        httpMethod: 'POST',
        path: '/cars',
        body: JSON.stringify({
          ...TEST_CARS.toyotaCorolla,
          year: 1800, // Invalid year
        }),
      });

      const result = await handleCreateCar(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

    it('returns 400 when price is negative', async () => {
      const event = createAdminEvent({
        httpMethod: 'POST',
        path: '/cars',
        body: JSON.stringify({
          ...TEST_CARS.toyotaCorolla,
          price: -50000,
        }),
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
          ...TEST_CARS.toyotaCorolla,
          condition: 'invalid-condition',
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
          ...TEST_CARS.toyotaCorolla,
          transmission: 'invalid-transmission',
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
          ...TEST_CARS.toyotaCorolla,
          fuel_type: 'invalid-fuel',
        }),
      });

      const result = await handleCreateCar(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });

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
  });

  // ============================================
  // PUT /cars/:id - Update Car (Admin Only)
  // ============================================
  describe('PUT /cars/:id - Update Car', () => {
    let testCarId: string;

    beforeAll(async () => {
      // Create a car to update
      const event = createAdminEvent({
        httpMethod: 'POST',
        path: '/cars',
        body: JSON.stringify(TEST_CARS.vwPoloVivo),
      });
      const result = await handleCreateCar(event);
      if (result.statusCode === 201) {
        const car = expectSuccess<any>(result.body);
        testCarId = car.id;
        createdCarIds.push(testCarId);
      }
    });

    it('updates car with valid data when admin', async () => {
      if (!testCarId) {
        console.log('No test car created, skipping');
        return;
      }

      const event = createAdminEvent({
        httpMethod: 'PUT',
        path: `/cars/${testCarId}`,
        pathParameters: { carId: testCarId },
        body: JSON.stringify({
          price: 205000, // Updated price
          mileage: 50000, // Updated mileage
        }),
      });

      const result = await handleUpdateCar(event);

      expect(result.statusCode).toBe(200);
      const car = expectSuccess<any>(result.body);
      
      expect(car.id).toBe(testCarId);
      expect(parseFloat(car.price)).toBe(205000);
      expect(car.mileage).toBe(50000);
    });

    it('returns 401 when not authenticated', async () => {
      if (!testCarId) return;

      const event = createMockEvent({
        httpMethod: 'PUT',
        path: `/cars/${testCarId}`,
        pathParameters: { carId: testCarId },
        body: JSON.stringify({ price: 200000 }),
      });

      const result = await handleUpdateCar(event);

      expect(result.statusCode).toBe(401);
      expectError(result.body, 'UNAUTHORIZED');
    });

    it('returns 403 when not admin', async () => {
      if (!testCarId) return;

      const event = createUserEvent({
        httpMethod: 'PUT',
        path: `/cars/${testCarId}`,
        pathParameters: { carId: testCarId },
        body: JSON.stringify({ price: 200000 }),
      });

      const result = await handleUpdateCar(event);

      expect(result.statusCode).toBe(403);
      expectError(result.body, 'FORBIDDEN');
    });

    it('returns 404 for non-existent car', async () => {
      const event = createAdminEvent({
        httpMethod: 'PUT',
        path: '/cars/00000000-0000-0000-0000-000000000000',
        pathParameters: { carId: '00000000-0000-0000-0000-000000000000' },
        body: JSON.stringify({ price: 200000 }),
      });

      const result = await handleUpdateCar(event);

      expect(result.statusCode).toBe(404);
      expectError(result.body, 'NOT_FOUND');
    });

    it('returns 400 when year is invalid', async () => {
      if (!testCarId) return;

      const event = createAdminEvent({
        httpMethod: 'PUT',
        path: `/cars/${testCarId}`,
        pathParameters: { carId: testCarId },
        body: JSON.stringify({ year: 1800 }),
      });

      const result = await handleUpdateCar(event);

      expect(result.statusCode).toBe(400);
      expectError(result.body, 'VALIDATION_ERROR');
    });
  });

  // ============================================
  // DELETE /cars/:id - Soft Delete Car (Admin Only)
  // ============================================
  describe('DELETE /cars/:id - Soft Delete Car', () => {
    let deleteTestCarId: string;

    beforeAll(async () => {
      // Create a car to delete
      const event = createAdminEvent({
        httpMethod: 'POST',
        path: '/cars',
        body: JSON.stringify({
          ...TEST_CARS.hyundaiTucson,
          status: 'active',
        }),
      });
      const result = await handleCreateCar(event);
      if (result.statusCode === 201) {
        const car = expectSuccess<any>(result.body);
        deleteTestCarId = car.id;
        // Don't add to cleanup - we're testing delete
      }
    });

    it('soft deletes car when admin', async () => {
      if (!deleteTestCarId) {
        console.log('No test car created, skipping');
        return;
      }

      const event = createAdminEvent({
        httpMethod: 'DELETE',
        path: `/cars/${deleteTestCarId}`,
        pathParameters: { carId: deleteTestCarId },
      });

      const result = await handleDeleteCar(event);

      expect(result.statusCode).toBe(200);
      const data = expectSuccess<any>(result.body);
      
      expect(data.id).toBe(deleteTestCarId);
      expect(data.deleted).toBe(true);
    });

    it('deleted car does not appear in public list', async () => {
      if (!deleteTestCarId) return;

      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/cars',
      });

      const result = await handleGetCars(event);
      const data = expectSuccess<PaginatedResponse<any>>(result.body);
      
      const deletedCar = data.data.find((car: any) => car.id === deleteTestCarId);
      expect(deletedCar).toBeUndefined();
    });

    it('returns 200 for already deleted car (idempotent)', async () => {
      if (!deleteTestCarId) return;

      const event = createAdminEvent({
        httpMethod: 'DELETE',
        path: `/cars/${deleteTestCarId}`,
        pathParameters: { carId: deleteTestCarId },
      });

      const result = await handleDeleteCar(event);

      // Should still return 200 (idempotent)
      expect(result.statusCode).toBe(200);
    });

    it('returns 401 when not authenticated', async () => {
      const event = createMockEvent({
        httpMethod: 'DELETE',
        path: '/cars/some-id',
        pathParameters: { carId: 'some-id' },
      });

      const result = await handleDeleteCar(event);

      expect(result.statusCode).toBe(401);
      expectError(result.body, 'UNAUTHORIZED');
    });

    it('returns 403 when not admin', async () => {
      const event = createUserEvent({
        httpMethod: 'DELETE',
        path: '/cars/some-id',
        pathParameters: { carId: 'some-id' },
      });

      const result = await handleDeleteCar(event);

      expect(result.statusCode).toBe(403);
      expectError(result.body, 'FORBIDDEN');
    });
  });

  // Cleanup created test cars
  afterAll(async () => {
    for (const carId of createdCarIds) {
      try {
        const event = createAdminEvent({
          httpMethod: 'DELETE',
          path: `/cars/${carId}`,
          pathParameters: { carId },
        });
        await handleDeleteCar(event);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });
});
