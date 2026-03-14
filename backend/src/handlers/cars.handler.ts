import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CarService, ListCarsInput, CreateCarInput } from '../services/cars.service';
import { success, error, paginated } from '../lib/response';

const carService = new CarService();

const CONDITION_VALUES = ['excellent', 'good', 'fair', 'poor'];
const TRANSMISSION_VALUES = ['automatic', 'manual', 'cvt'];
const FUEL_TYPE_VALUES = ['petrol', 'diesel', 'electric', 'hybrid'];
const STATUS_VALUES = ['active', 'pending', 'sold', 'deleted'];

function isAdmin(event: APIGatewayProxyEvent): boolean {
  const claims = event.requestContext.authorizer?.claims;
  if (!claims) return false;
  const groups = claims['cognito:groups'] || '';
  return groups.includes('admin');
}

function requireAdmin(event: APIGatewayProxyEvent): APIGatewayProxyResult | null {
  const claims = event.requestContext.authorizer?.claims;
  if (!claims) {
    return error('Authentication required', 'UNAUTHORIZED', 401);
  }
  if (!isAdmin(event)) {
    return error('Forbidden: Admin access required', 'FORBIDDEN', 403);
  }
  return null;
}

export async function handleGetCars(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const query = event.queryStringParameters || {};

  // Check if user is admin for status filtering
  const userIsAdmin = isAdmin(event);
  const statusFilter = query.status;
  
  // Only allow status filtering for admin users
  // For non-admin, always show only 'active' cars
  let status: string | undefined;
  if (userIsAdmin && statusFilter) {
    // Admin can filter by specific status or see all (no filter)
    status = statusFilter === 'all' ? undefined : statusFilter;
  }
  // Non-admin users don't pass status, so service defaults to 'active'

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
    status: userIsAdmin ? status : undefined, // Only pass status for admin
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

export async function handleCreateCar(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
      return error('Authentication required', 'UNAUTHORIZED', 401);
    }
    if (!isAdmin(event)) {
      return error('Forbidden: Admin access required', 'FORBIDDEN', 403);
    }

    if (!event.body) {
      return error('Missing request body', 'VALIDATION_ERROR', 400);
    }

    const body = JSON.parse(event.body) as Record<string, unknown>;

    const make = typeof body.make === 'string' ? body.make.trim() : undefined;
    const model = typeof body.model === 'string' ? body.model.trim() : undefined;
    const year = typeof body.year === 'number' ? body.year : typeof body.year === 'string' ? parseInt(body.year, 10) : undefined;
    const price = typeof body.price === 'number' ? body.price : typeof body.price === 'string' ? parseFloat(body.price) : undefined;
    const mileage = typeof body.mileage === 'number' ? body.mileage : typeof body.mileage === 'string' ? parseInt(body.mileage, 10) : 0;
    const condition = typeof body.condition === 'string' && CONDITION_VALUES.includes(body.condition) ? body.condition : undefined;
    const transmission = typeof body.transmission === 'string' && TRANSMISSION_VALUES.includes(body.transmission) ? body.transmission : undefined;
    const fuel_type = typeof body.fuel_type === 'string' && FUEL_TYPE_VALUES.includes(body.fuel_type) ? body.fuel_type : undefined;
    const status = typeof body.status === 'string' && STATUS_VALUES.includes(body.status) ? body.status : 'active';

    if (!make || !model) {
      return error('make and model are required', 'VALIDATION_ERROR', 400);
    }
    if (year === undefined || isNaN(year) || year < 1900 || year > 2100) {
      return error('year must be a number between 1900 and 2100', 'VALIDATION_ERROR', 400);
    }
    if (price === undefined || isNaN(price) || price < 0) {
      return error('price must be a non-negative number', 'VALIDATION_ERROR', 400);
    }
    if (!condition) {
      return error(`condition must be one of: ${CONDITION_VALUES.join(', ')}`, 'VALIDATION_ERROR', 400);
    }
    if (!transmission) {
      return error(`transmission must be one of: ${TRANSMISSION_VALUES.join(', ')}`, 'VALIDATION_ERROR', 400);
    }
    if (!fuel_type) {
      return error(`fuel_type must be one of: ${FUEL_TYPE_VALUES.join(', ')}`, 'VALIDATION_ERROR', 400);
    }

    const input: CreateCarInput = {
      make,
      model,
      variant: typeof body.variant === 'string' ? body.variant.trim() || undefined : undefined,
      year,
      price,
      mileage: Number.isInteger(mileage) && mileage >= 0 ? mileage : 0,
      condition,
      body_type: typeof body.body_type === 'string' ? body.body_type.trim() || undefined : undefined,
      transmission,
      fuel_type,
      color: typeof body.color === 'string' ? body.color.trim() || undefined : undefined,
      description: typeof body.description === 'string' ? body.description.trim() || undefined : undefined,
      features: Array.isArray(body.features) ? body.features.filter((f): f is string => typeof f === 'string') : undefined,
      status: status as CreateCarInput['status'],
      video_url: typeof body.video_url === 'string' ? body.video_url.trim() || undefined : undefined,
    };

    const car = await carService.createCar(input);
    return success(car, 201);
  } catch (err) {
    console.error('Error creating car:', {
      error: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
      name: err instanceof Error ? err.name : undefined,
    });
    // In development, include more error details
    const isDev = process.env.NODE_ENV === 'development' || process.env.STAGE === 'dev';
    const message = isDev && err instanceof Error 
      ? `Failed to create car: ${err.message}` 
      : 'Failed to create car';
    return error(message, 'INTERNAL_ERROR', 500);
  }
}

export async function handleUpdateCar(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const authError = requireAdmin(event);
    if (authError) return authError;

    const carId = event.pathParameters?.carId;
    if (!carId) {
      return error('Car ID is required', 'VALIDATION_ERROR', 400);
    }

    if (!event.body) {
      return error('Missing request body', 'VALIDATION_ERROR', 400);
    }

    const body = JSON.parse(event.body) as Record<string, unknown>;
    const input: Partial<CreateCarInput> = {};

    // Parse and validate optional fields
    if (body.make !== undefined) {
      if (typeof body.make !== 'string' || !body.make.trim()) {
        return error('make must be a non-empty string', 'VALIDATION_ERROR', 400);
      }
      input.make = body.make.trim();
    }

    if (body.model !== undefined) {
      if (typeof body.model !== 'string' || !body.model.trim()) {
        return error('model must be a non-empty string', 'VALIDATION_ERROR', 400);
      }
      input.model = body.model.trim();
    }

    if (body.variant !== undefined) {
      input.variant = typeof body.variant === 'string' ? body.variant.trim() || undefined : undefined;
    }

    if (body.year !== undefined) {
      const year = typeof body.year === 'number' ? body.year : parseInt(String(body.year), 10);
      if (isNaN(year) || year < 1900 || year > 2100) {
        return error('year must be a number between 1900 and 2100', 'VALIDATION_ERROR', 400);
      }
      input.year = year;
    }

    if (body.price !== undefined) {
      const price = typeof body.price === 'number' ? body.price : parseFloat(String(body.price));
      if (isNaN(price) || price < 0) {
        return error('price must be a non-negative number', 'VALIDATION_ERROR', 400);
      }
      input.price = price;
    }

    if (body.mileage !== undefined) {
      const mileage = typeof body.mileage === 'number' ? body.mileage : parseInt(String(body.mileage), 10);
      if (isNaN(mileage) || mileage < 0) {
        return error('mileage must be a non-negative number', 'VALIDATION_ERROR', 400);
      }
      input.mileage = mileage;
    }

    if (body.condition !== undefined) {
      if (typeof body.condition !== 'string' || !CONDITION_VALUES.includes(body.condition)) {
        return error(`condition must be one of: ${CONDITION_VALUES.join(', ')}`, 'VALIDATION_ERROR', 400);
      }
      input.condition = body.condition as CreateCarInput['condition'];
    }

    if (body.body_type !== undefined) {
      input.body_type = typeof body.body_type === 'string' ? body.body_type.trim() || undefined : undefined;
    }

    if (body.transmission !== undefined) {
      if (typeof body.transmission !== 'string' || !TRANSMISSION_VALUES.includes(body.transmission)) {
        return error(`transmission must be one of: ${TRANSMISSION_VALUES.join(', ')}`, 'VALIDATION_ERROR', 400);
      }
      input.transmission = body.transmission as CreateCarInput['transmission'];
    }

    if (body.fuel_type !== undefined) {
      if (typeof body.fuel_type !== 'string' || !FUEL_TYPE_VALUES.includes(body.fuel_type)) {
        return error(`fuel_type must be one of: ${FUEL_TYPE_VALUES.join(', ')}`, 'VALIDATION_ERROR', 400);
      }
      input.fuel_type = body.fuel_type as CreateCarInput['fuel_type'];
    }

    if (body.color !== undefined) {
      input.color = typeof body.color === 'string' ? body.color.trim() || undefined : undefined;
    }

    if (body.description !== undefined) {
      input.description = typeof body.description === 'string' ? body.description.trim() || undefined : undefined;
    }

    if (body.features !== undefined) {
      input.features = Array.isArray(body.features) 
        ? body.features.filter((f): f is string => typeof f === 'string') 
        : undefined;
    }

    if (body.status !== undefined) {
      if (typeof body.status !== 'string' || !STATUS_VALUES.includes(body.status)) {
        return error(`status must be one of: ${STATUS_VALUES.join(', ')}`, 'VALIDATION_ERROR', 400);
      }
      input.status = body.status as CreateCarInput['status'];
    }

    if (body.video_url !== undefined) {
      input.video_url = typeof body.video_url === 'string' ? body.video_url.trim() || undefined : undefined;
    }

    const car = await carService.updateCar(carId, input);
    
    if (!car) {
      return error('Car not found', 'NOT_FOUND', 404);
    }

    return success(car);
  } catch (err) {
    console.error('Error updating car:', err);
    return error('Failed to update car', 'INTERNAL_ERROR', 500);
  }
}

export async function handleDeleteCar(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const authError = requireAdmin(event);
    if (authError) return authError;

    const carId = event.pathParameters?.carId;
    if (!carId) {
      return error('Car ID is required', 'VALIDATION_ERROR', 400);
    }

    const deleted = await carService.deleteCar(carId);
    
    // Return 200 even if already deleted (idempotent)
    return success({ deleted, id: carId });
  } catch (err) {
    console.error('Error deleting car:', err);
    return error('Failed to delete car', 'INTERNAL_ERROR', 500);
  }
}
