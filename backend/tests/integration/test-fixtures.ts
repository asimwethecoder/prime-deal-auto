/**
 * Test Fixtures for Prime Deal Auto Integration Tests
 * 
 * Realistic South African car data with prices in ZAR
 */

import type { APIGatewayProxyEvent } from 'aws-lambda';

// ============================================
// Car Test Data
// ============================================

export const TEST_CARS = {
  toyotaCorolla: {
    make: 'Toyota',
    model: 'Corolla',
    variant: '1.8 XS CVT',
    year: 2023,
    price: 389000, // R389,000
    mileage: 15000,
    condition: 'excellent',
    body_type: 'Sedan',
    transmission: 'cvt',
    fuel_type: 'petrol',
    color: 'White',
    description: 'Well-maintained Toyota Corolla with full service history.',
    features: ['Bluetooth', 'Reverse Camera', 'Cruise Control', 'Alloy Wheels'],
    status: 'active',
  },
  bmwX5: {
    make: 'BMW',
    model: 'X5',
    variant: 'xDrive30d M Sport',
    year: 2022,
    price: 1250000, // R1,250,000
    mileage: 35000,
    condition: 'excellent',
    body_type: 'SUV',
    transmission: 'automatic',
    fuel_type: 'diesel',
    color: 'Black',
    description: 'Luxury BMW X5 with M Sport package and panoramic sunroof.',
    features: ['Panoramic Sunroof', 'Leather Seats', 'Navigation', 'Heated Seats', 'Parking Sensors'],
    status: 'active',
  },
  vwPoloVivo: {
    make: 'Volkswagen',
    model: 'Polo Vivo',
    variant: '1.4 Trendline',
    year: 2021,
    price: 195000, // R195,000
    mileage: 45000,
    condition: 'good',
    body_type: 'Hatchback',
    transmission: 'manual',
    fuel_type: 'petrol',
    color: 'Silver',
    description: 'Economical VW Polo Vivo, perfect for city driving.',
    features: ['Air Conditioning', 'Power Steering', 'Central Locking'],
    status: 'active',
  },
  fordRanger: {
    make: 'Ford',
    model: 'Ranger',
    variant: '2.0 BiTurbo Wildtrak',
    year: 2023,
    price: 895000, // R895,000
    mileage: 8000,
    condition: 'excellent',
    body_type: 'Bakkie',
    transmission: 'automatic',
    fuel_type: 'diesel',
    color: 'Blue',
    description: 'Top-spec Ford Ranger Wildtrak with all the bells and whistles.',
    features: ['Leather Seats', 'Navigation', 'Adaptive Cruise Control', 'Lane Keep Assist', 'Tonneau Cover'],
    status: 'active',
  },
  mercedesC200: {
    make: 'Mercedes-Benz',
    model: 'C-Class',
    variant: 'C200 AMG Line',
    year: 2020,
    price: 650000, // R650,000
    mileage: 55000,
    condition: 'good',
    body_type: 'Sedan',
    transmission: 'automatic',
    fuel_type: 'petrol',
    color: 'Grey',
    description: 'Elegant Mercedes C200 with AMG styling package.',
    features: ['AMG Styling', 'Leather Seats', 'Sunroof', 'Apple CarPlay'],
    status: 'active',
  },
  hyundaiTucson: {
    make: 'Hyundai',
    model: 'Tucson',
    variant: '2.0 Premium',
    year: 2022,
    price: 545000, // R545,000
    mileage: 28000,
    condition: 'excellent',
    body_type: 'SUV',
    transmission: 'automatic',
    fuel_type: 'petrol',
    color: 'Red',
    description: 'Stylish Hyundai Tucson with premium features.',
    features: ['Panoramic Sunroof', 'Wireless Charging', 'Blind Spot Monitor'],
    status: 'active',
  },
  deletedCar: {
    make: 'Nissan',
    model: 'Almera',
    variant: '1.5 Acenta',
    year: 2019,
    price: 165000,
    mileage: 78000,
    condition: 'fair',
    body_type: 'Sedan',
    transmission: 'manual',
    fuel_type: 'petrol',
    color: 'White',
    description: 'Deleted test car - should not appear in public queries.',
    features: [],
    status: 'deleted',
  },
} as const;

// ============================================
// Lead Test Data
// ============================================

export const TEST_LEADS = {
  validLead: {
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    phone: '+27821234567',
    enquiry: 'I am interested in the Toyota Corolla. Is it still available?',
  },
  minimalLead: {
    email: 'minimal@example.com',
  },
  invalidEmail: {
    firstName: 'Test',
    email: 'not-an-email',
  },
  missingEmail: {
    firstName: 'Test',
    lastName: 'User',
    phone: '+27821234567',
  },
} as const;

// ============================================
// Search Test Data
// ============================================

export const SEARCH_QUERIES = {
  byMake: { make: 'Toyota' },
  byPriceRange: { minPrice: 200000, maxPrice: 500000 },
  byYear: { minYear: 2022 },
  byBodyType: { bodyType: 'SUV' },
  byFuelType: { fuelType: 'diesel' },
  byTransmission: { transmission: 'automatic' },
  combined: {
    make: 'BMW',
    minPrice: 1000000,
    bodyType: 'SUV',
    fuelType: 'diesel',
  },
  fullText: { q: 'luxury leather sunroof' },
} as const;

// ============================================
// Auth Mock Helpers
// ============================================

export const MOCK_ADMIN_CLAIMS = {
  sub: 'admin-user-123',
  email: 'admin@primedealauto.co.za',
  'cognito:groups': 'admin',
  'cognito:username': 'admin-user',
};

export const MOCK_USER_CLAIMS = {
  sub: 'regular-user-456',
  email: 'user@example.com',
  'cognito:groups': '',
  'cognito:username': 'regular-user',
};

// ============================================
// Event Factory
// ============================================

export function createMockEvent(
  overrides: Partial<APIGatewayProxyEvent> = {}
): APIGatewayProxyEvent {
  return {
    httpMethod: 'GET',
    path: '/',
    body: null,
    headers: {},
    multiValueHeaders: {},
    isBase64Encoded: false,
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
      accountId: '141814481613',
      apiId: 'test-api',
      authorizer: null,
      protocol: 'HTTP/1.1',
      httpMethod: 'GET',
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        clientCert: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: '127.0.0.1',
        user: null,
        userAgent: 'vitest',
        userArn: null,
      },
      path: '/',
      stage: 'test',
      requestId: 'test-request-id',
      requestTimeEpoch: Date.now(),
      resourceId: 'test-resource',
      resourcePath: '/',
    },
    resource: '',
    ...overrides,
  } as APIGatewayProxyEvent;
}

export function createAdminEvent(
  overrides: Partial<APIGatewayProxyEvent> = {}
): APIGatewayProxyEvent {
  return createMockEvent({
    ...overrides,
    requestContext: {
      ...createMockEvent().requestContext,
      authorizer: {
        claims: MOCK_ADMIN_CLAIMS,
      },
      ...(overrides.requestContext || {}),
    },
  });
}

export function createUserEvent(
  overrides: Partial<APIGatewayProxyEvent> = {}
): APIGatewayProxyEvent {
  return createMockEvent({
    ...overrides,
    requestContext: {
      ...createMockEvent().requestContext,
      authorizer: {
        claims: MOCK_USER_CLAIMS,
      },
      ...(overrides.requestContext || {}),
    },
  });
}

// ============================================
// Response Helpers
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export function parseResponse<T>(body: string): ApiResponse<T> {
  return JSON.parse(body);
}

export function expectSuccess<T>(body: string): T {
  const response = parseResponse<T>(body);
  if (!response.success) {
    throw new Error(`Expected success but got error: ${response.error} (${response.code})`);
  }
  return response.data as T;
}

export function expectError(body: string, expectedCode?: string): { error: string; code: string } {
  const response = parseResponse(body);
  if (response.success) {
    throw new Error('Expected error but got success');
  }
  if (expectedCode && response.code !== expectedCode) {
    throw new Error(`Expected code ${expectedCode} but got ${response.code}`);
  }
  return { error: response.error!, code: response.code! };
}

// ============================================
// Price Formatting (ZAR)
// ============================================

export function formatZAR(price: number): string {
  return `R${price.toLocaleString('en-ZA')}`;
}

export function parseZAR(formatted: string): number {
  return parseInt(formatted.replace(/[R,\s]/g, ''), 10);
}
