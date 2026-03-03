import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CarService, ListCarsInput } from '../services/cars.service';
import { success, error, paginated } from '../lib/response';

const carService = new CarService();

export async function handleGetCars(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const query = event.queryStringParameters || {};

  const input: ListCarsInput = {
    make: query.make,
    model: query.model,
    minYear: query.minYear ? parseInt(query.minYear, 10) : undefined,
    maxYear: query.maxYear ? parseInt(query.maxYear, 10) : undefined,
    minPrice: query.minPrice ? parseFloat(query.minPrice) : undefined,
    maxPrice: query.maxPrice ? parseFloat(query.maxPrice) : undefined,
    condition: query.condition,
    transmission: query.transmission,
    fuelType: query.fuelType,
    bodyType: query.bodyType,
    limit: query.limit ? parseInt(query.limit, 10) : 20,
    offset: query.offset ? parseInt(query.offset, 10) : 0,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder as 'asc' | 'desc' | undefined,
  };

  const result = await carService.listCars(input);

  return paginated(result.cars, result.total, result.page, result.limit);
}

export async function handleGetCarById(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const carId = event.pathParameters?.carId;

  if (!carId) {
    return error('Car ID is required', 'VALIDATION_ERROR', 400);
  }

  const car = await carService.getCarById(carId);

  if (!car) {
    return error('Car not found', 'NOT_FOUND', 404);
  }

  return success(car);
}
