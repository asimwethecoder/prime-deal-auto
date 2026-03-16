/**
 * Database Mock for Integration Tests
 * 
 * Provides mock implementations of database operations
 */

import { vi } from 'vitest';
import { TEST_CARS } from '../test-fixtures';

// Convert test cars to database format with IDs
let carIdCounter = 1;
const mockCarsDb = Object.entries(TEST_CARS).map(([key, car]) => ({
  id: `car-${carIdCounter++}-${key}`,
  ...car,
  price: car.price.toString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  images: [],
}));

// Track created cars for tests
const createdCars: any[] = [];
const createdLeads: any[] = [];

export function getMockCars() {
  return [...mockCarsDb, ...createdCars].filter(c => c.status !== 'deleted');
}

export function getAllMockCars() {
  return [...mockCarsDb, ...createdCars];
}

export function resetMocks() {
  createdCars.length = 0;
  createdLeads.length = 0;
}

// Mock pool that returns mock data
export const mockPool = {
  query: vi.fn().mockImplementation(async (sql: string, params?: any[]) => {
    // Handle different query patterns
    if (sql.includes('SELECT') && sql.includes('FROM cars')) {
      const cars = getMockCars();
      return { rows: cars, rowCount: cars.length };
    }
    if (sql.includes('INSERT INTO cars')) {
      const newCar = {
        id: `car-new-${Date.now()}`,
        ...params,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      createdCars.push(newCar);
      return { rows: [newCar], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }),
  connect: vi.fn().mockResolvedValue({
    query: vi.fn(),
    release: vi.fn(),
  }),
};
