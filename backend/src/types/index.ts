export interface Car {
  id: string;
  make: string;
  model: string;
  variant?: string;
  year: number;
  price: number;
  mileage: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  body_type?: string;
  transmission: 'automatic' | 'manual' | 'cvt';
  fuel_type: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  color?: string;
  description?: string;
  features: string[];
  video_url?: string;
  status: 'active' | 'sold' | 'pending' | 'deleted';
  views_count: number;
  created_at: string;
  updated_at: string;
  images?: CarImage[];
  primary_image_url?: string;
}

export interface User {
  id: string;
  cognito_sub: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: 'user' | 'dealer' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  country?: string;
  enquiry?: string;
  car_id?: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

// Chat types are now in chat.types.ts
export * from './chat.types';

export interface CarImage {
  id: string;
  car_id: string;
  s3_key: string;
  cloudfront_url?: string;
  thumbnail_url?: string;
  is_primary: boolean;
  order_index: number;
  created_at: string;
}

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};
