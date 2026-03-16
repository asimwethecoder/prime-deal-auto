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
    
    // Facet query: SELECT col as value, COUNT(*) as count FROM cars ... GROUP BY col (col may be quoted)
    if (sqlLower.includes('as value') && sqlLower.includes('group by')) {
      const groupByMatch = sql.match(/GROUP BY\s+"?(\w+)"?/i);
      const column = groupByMatch ? groupByMatch[1] : 'make';
      const activeCars = testDataStore.cars.filter((c: any) => c.status === 'active');
      const counts: Record<string, number> = {};
      activeCars.forEach((car: any) => {
        const val = car[column];
        if (val != null && val !== '') {
          const key = String(val);
          counts[key] = (counts[key] || 0) + 1;
        }
      });
      const rows = Object.entries(counts).map(([value, count]) => ({ value, count: String(count) }));
      rows.sort((a, b) => Number(b.count) - Number(a.count) || a.value.localeCompare(b.value));
      return { rows: rows.slice(0, 50), rowCount: rows.length };
    }

    // SELECT cars with filters
    if (sqlLower.includes('select') && sqlLower.includes('from cars')) {
      let cars = testDataStore.cars.filter((c: any) => c.status === 'active');
      
      // Handle single car by ID
      if (sqlLower.includes('where') && sqlLower.includes('id')) {
        const carId = params?.[0];
        const car = testDataStore.cars.find((c: any) => c.id === carId);
        return { rows: car ? [car] : [], rowCount: car ? 1 : 0 };
      }
      
      return { rows: cars, rowCount: cars.length };
    }
    
    // COUNT query
    if (sqlLower.includes('count(*)')) {
      const activeCars = testDataStore.cars.filter(c => c.status === 'active');
      return { rows: [{ count: activeCars.length }], rowCount: 1 };
    }
    
    // INSERT car - params: make, model, variant, year, price, mileage, condition, body_type, transmission, fuel_type, color, description, features, status, video_url
    if (sqlLower.includes('insert into cars')) {
      const p = params ?? [];
      const newCar = {
        id: `car-${testDataStore.carIdCounter++}-new`,
        make: p[0],
        model: p[1],
        variant: p[2] ?? null,
        year: p[3],
        price: p[4],
        mileage: p[5] ?? 0,
        condition: p[6],
        body_type: p[7] ?? null,
        transmission: p[8],
        fuel_type: p[9],
        color: p[10] ?? null,
        description: p[11] ?? null,
        features: typeof p[12] === 'string' ? (() => { try { return JSON.parse(p[12]); } catch { return []; } })() : [],
        status: p[13] ?? 'active',
        video_url: p[14] ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        images: [],
      };
      testDataStore.cars.push(newCar);
      return { rows: [newCar], rowCount: 1 };
    }

    // UPDATE car - SET col1 = $1, col2 = $2, ... WHERE id = $N; last param is id
    if (sqlLower.includes('update cars') && !sqlLower.includes("status = 'deleted'")) {
      const carId = params?.[params.length - 1];
      const car = testDataStore.cars.find((c: any) => c.id === carId);
      if (!car) return { rows: [], rowCount: 0 };
      const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i);
      if (setMatch) {
        const setClause = setMatch[1];
        setClause.split(',').forEach((part: string) => {
          const trimmed = part.trim();
          const colMatch = trimmed.match(/^(\w+)\s*=\s*\$\d+/);
          if (colMatch) {
            const col = colMatch[1];
            const numMatch = trimmed.match(/\$(\d+)/);
            const idx = numMatch ? parseInt(numMatch[1], 10) - 1 : -1;
            if (params && idx >= 0 && idx < params.length - 1) {
              (car as any)[col] = params[idx];
            }
          } else if (trimmed.toLowerCase().startsWith('updated_at')) {
            (car as any).updated_at = new Date().toISOString();
          }
        });
      }
      return { rows: [car], rowCount: 1 };
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
    delete: vi.fn().mockResolvedValue({}),
    indices: {
      create: vi.fn().mockResolvedValue({ acknowledged: true }),
      delete: vi.fn().mockResolvedValue({}),
    },
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
