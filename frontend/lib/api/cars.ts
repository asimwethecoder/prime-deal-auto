// Cars API Module
// Functions for interacting with the cars endpoints

import { get } from './client';
import { Car, CarWithImages, PaginatedResponse, CarListParams } from './types';

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
