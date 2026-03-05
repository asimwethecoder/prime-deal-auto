// API Response Types for Prime Deal Auto Frontend
// These types match the backend API response format exactly

/**
 * Car entity from the database
 */
export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number; // ZAR
  mileage: number; // km
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  transmission: 'automatic' | 'manual' | 'cvt';
  fuel_type: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  body_type: string;
  color: string;
  description: string;
  features: string[];
  status: 'active' | 'sold' | 'pending' | 'deleted';
  created_at: string;
  updated_at: string;
}

/**
 * Car image entity
 */
export interface CarImage {
  id: string;
  car_id: string;
  s3_key: string;
  cloudfront_url: string;
  display_order: number;
  is_primary: boolean;
}

/**
 * Car with images (joined query result)
 */
export interface CarWithImages extends Car {
  images: CarImage[];
}

/**
 * Generic paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Generic API success response wrapper
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'RATE_LIMITED' | 'INTERNAL_ERROR';
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Query parameters for car listing
 */
export interface CarListParams {
  limit?: number;
  offset?: number;
  make?: string;
  model?: string;
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  condition?: Car['condition'];
  transmission?: Car['transmission'];
  fuelType?: Car['fuel_type'];
  bodyType?: string;
  sortBy?: 'price' | 'year' | 'mileage' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Chat message entity
 */
export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

/**
 * Chat session entity
 */
export interface ChatSession {
  id: string;
  user_id: string | null;
  session_token: string;
  created_at: string;
  last_message_at: string;
}

/**
 * Lead entity
 */
export interface Lead {
  id: string;
  car_id: string;
  full_name: string;
  email: string;
  phone: string;
  message: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
  created_at: string;
  updated_at: string;
}
