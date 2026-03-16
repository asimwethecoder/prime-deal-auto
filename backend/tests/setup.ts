/**
 * Vitest Setup File
 * 
 * Configures mocks and environment for all tests
 */

import { vi, afterEach, beforeEach } from 'vitest';

// Mock environment variables BEFORE any imports
process.env.SECRET_ARN = 'arn:aws:secretsmanager:us-east-1:123456789:secret:test';
process.env.DB_HOST = 'localhost';
process.env.DB_NAME = 'test_db';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.S3_BUCKET = 'test-bucket';
process.env.CLOUDFRONT_URL = 'https://test.cloudfront.net';
process.env.OPENSEARCH_ENDPOINT = 'https://test.opensearch.amazonaws.com';
process.env.BEDROCK_MODEL_ID = 'amazon.nova-pro-v1:0';

// In-memory test data store
const testDataStore = {
  cars: [] as any[],
  leads: [] as any[],
  images: [] as any[],
  carIdCounter: 1,
  leadIdCounter: 1,
  imageIdCounter: 1,
};

// Initialize with sample cars
function initTestData() {
  testDataStore.cars = [
    {
      id: 'car-1-toyota',
      make: 'Toyota',
      model: 'Corolla',
      variant: '1.8 XS CVT',
      year: 2023,
      price: '389000',
      mileage: 15000,
      condition: 'excellent',
      body_type: 'Sedan',
      transmission: 'cvt',
      fuel_type: 'petrol',
      color: 'White',
      description: 'Well-maintained Toyota Corolla',
      features: ['Bluetooth', 'Reverse Camera'],
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      images: [],
    },
    {
      id: 'car-2-bmw',
      make: 'BMW',
      model: 'X5',
      variant: 'xDrive30d M Sport',
      year: 2022,
      price: '1250000',
      mileage: 35000,
      condition: 'excellent',
      body_type: 'SUV',
      transmission: 'automatic',
      fuel_type: 'diesel',
      color: 'Black',
      description: 'Luxury BMW X5',
      features: ['Panoramic Sunroof', 'Leather Seats'],
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      images: [],
    },
    {
      id: 'car-3-vw',
      make: 'Volkswagen',
      model: 'Polo Vivo',
      variant: '1.4 Trendline',
      year: 2021,
      price: '195000',
      mileage: 45000,
      condition: 'good',
      body_type: 'Hatchback',
      transmission: 'manual',
      fuel_type: 'petrol',
      color: 'Silver',
      description: 'Economical VW Polo Vivo',
      features: ['Air Conditioning'],
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      images: [],
    },
  ];
  testDataStore.carIdCounter = 4;
}

initTestData();

// Create mock pool with query implementation
const createMockPool = () => ({
  query: vi.fn().mockImplementation(async (sql: string, params?: any[]) => {
    const sqlLower = sql.toLowerCase();
    
    // SELECT cars with filters
    if (sqlLower.includes('select') && sqlLower.includes('from cars')) {
      let cars = testDataStore.cars.filter(c => c.status === 'active');
      
      // Apply basic filters from params if present
      if (params && params.length > 0) {
        // This is simplified - real implementation would parse SQL
      }
      
      // Handle single car by ID
      if (sqlLower.includes('where') && sqlLower.includes('id')) {
        const carId = params?.[0];
        const car = testDataStore.cars.find(c => c.id === carId);
        return { rows: car ? [car] : [], rowCount: car ? 1 : 0 };
      }
      
      return { rows: cars, rowCount: cars.length };
    }
    
    // COUNT query
    if (sqlLower.includes('count(*)')) {
      const activeCars = testDataStore.cars.filter(c => c.status === 'active');
      return { rows: [{ count: activeCars.length }], rowCount: 1 };
    }
    
    // INSERT car
    if (sqlLower.includes('insert into cars')) {
      const newCar = {
        id: `car-${testDataStore.carIdCounter++}-new`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        images: [],
        status: 'active',
      };
      testDataStore.cars.push(newCar);
      return { rows: [newCar], rowCount: 1 };
    }
    
    // UPDATE car
    if (sqlLower.includes('update cars')) {
      const carId = params?.[params.length - 1]; // ID is usually last param
      const car = testDataStore.cars.find(c => c.id === carId);
      if (car) {
        car.updated_at = new Date().toISOString();
        return { rows: [car], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }
    
    // DELETE (soft delete)
    if (sqlLower.includes('update') && sqlLower.includes('status')) {
      const carId = params?.[params.length - 1];
      const car = testDataStore.cars.find(c => c.id === carId);
      if (car) {
        car.status = 'deleted';
        return { rows: [{ id: carId, deleted: true }], rowCount: 1 };
      }
      return { rows: [{ id: carId, deleted: true }], rowCount: 1 }; // Idempotent
    }
    
    // INSERT lead
    if (sqlLower.includes('insert into leads')) {
      const newLead = {
        id: `lead-${testDataStore.leadIdCounter++}`,
        created_at: new Date().toISOString(),
      };
      testDataStore.leads.push(newLead);
      return { rows: [newLead], rowCount: 1 };
    }
    
    // SELECT images
    if (sqlLower.includes('from car_images') || sqlLower.includes('from images')) {
      return { rows: testDataStore.images, rowCount: testDataStore.images.length };
    }
    
    // Default empty response
    return { rows: [], rowCount: 0 };
  }),
  connect: vi.fn().mockResolvedValue({
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    release: vi.fn(),
  }),
});

// Mock the database module
vi.mock('../src/lib/database', () => {
  return {
    getPool: vi.fn().mockImplementation(() => createMockPool()),
    query: vi.fn().mockImplementation(async (sql: string, params?: any[]) => {
      return createMockPool().query(sql, params);
    }),
  };
});

// Mock Secrets Manager
vi.mock('@aws-sdk/client-secrets-manager', () => ({
  SecretsManagerClient: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue({
      SecretString: JSON.stringify({
        username: 'test',
        password: 'test',
        host: 'localhost',
        port: 5432,
        dbname: 'test_db',
      }),
    }),
  })),
  GetSecretValueCommand: vi.fn(),
}));

// Mock S3
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue({}),
  })),
  PutObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
  GetObjectCommand: vi.fn(),
}));

// Mock S3 presigner
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://test-bucket.s3.amazonaws.com/presigned-url'),
}));

// Mock OpenSearch
vi.mock('../src/lib/opensearch', () => ({
  getOpenSearchClient: vi.fn().mockReturnValue({
    search: vi.fn().mockResolvedValue({
      body: { hits: { hits: [], total: { value: 0 } } },
    }),
    index: vi.fn().mockResolvedValue({}),
    bulk: vi.fn().mockResolvedValue({ body: { errors: false } }),
  }),
  OpenSearchError: class OpenSearchError extends Error {},
}));

// Mock Bedrock
vi.mock('../src/lib/bedrock', () => ({
  getBedrockClient: vi.fn().mockReturnValue({
    send: vi.fn().mockResolvedValue({
      output: {
        message: {
          content: [{ text: '{"filters": {}, "confidence": 0.5}' }],
        },
      },
    }),
  }),
}));

// Reset test data after each test
afterEach(() => {
  vi.clearAllMocks();
  // Reset to initial state
  initTestData();
});
