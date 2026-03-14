// Cars API Module
// Functions for interacting with the cars endpoints

import { get, post, put, del } from './client';
import { Car, CarWithImages, PaginatedResponse, CarListParams, CreateCarRequest } from './types';

/**
 * Fetch a paginated list of cars
 * 
 * @param params - Query parameters for filtering, sorting, and pagination
 * @returns Paginated list of cars with images
 */
export async function getCars(
  params?: CarListParams
): Promise<PaginatedResponse<CarWithImages>> {
  return get<PaginatedResponse<CarWithImages>>('/cars', params);
}

/**
 * Fetch a single car by ID
 * 
 * @param carId - The UUID of the car
 * @returns Car details with images
 * @throws ApiError if car not found (404)
 */
export async function getCar(carId: string): Promise<CarWithImages> {
  return get<CarWithImages>(`/cars/${carId}`);
}

/**
 * Create a new car listing (admin only).
 * @param data - Car payload (make, model, year, price, mileage, condition, transmission, fuel_type; optional variant, body_type, color, description, features, status)
 * @returns Created car
 */
export async function createCar(data: CreateCarRequest): Promise<Car> {
  return post<Car>('/cars', data);
}

/**
 * Update an existing car listing (admin only).
 * @param carId - The UUID of the car to update
 * @param data - Partial car payload with fields to update
 * @returns Updated car
 */
export async function updateCar(carId: string, data: Partial<CreateCarRequest>): Promise<Car> {
  return put<Car>(`/cars/${carId}`, data);
}

/**
 * Delete a car listing (soft delete, admin only).
 * @param carId - The UUID of the car to delete
 * @returns Delete result
 */
export async function deleteCar(carId: string): Promise<{ deleted: boolean; id: string }> {
  return del<{ deleted: boolean; id: string }>(`/cars/${carId}`);
}

/**
 * Fetch featured cars for the home page
 * Convenience function that fetches the first 6 active cars
 * 
 * @returns List of featured cars
 */
export async function getFeaturedCars(): Promise<CarWithImages[]> {
  const response = await getCars({ limit: 6 });
  return response.data;
}

/**
 * Fetch all active cars (for sitemap generation)
 * Note: This should only be used server-side for sitemap generation
 * 
 * @returns All active cars
 */
export async function getAllActiveCars(): Promise<Car[]> {
  // Fetch with a large limit to get all cars
  // In production, this might need pagination handling
  const response = await getCars({ limit: 10000 });
  return response.data;
}
