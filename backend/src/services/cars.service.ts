import { CarRepository, CarFilters, CreateCarData } from '../repositories/cars.repository';
import { Car } from '../types';

export interface CreateCarInput {
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
  features?: string[];
  status?: 'active' | 'pending' | 'sold' | 'deleted';
  video_url?: string;
}

export interface ListCarsInput {
  make?: string;
  model?: string;
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  transmission?: string;
  fuelType?: string;
  bodyType?: string;
  status?: string; // For admin filtering
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ListCarsResult {
  cars: Car[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export class CarService {
  private repository: CarRepository;

  constructor() {
    this.repository = new CarRepository();
  }

  async listCars(input: ListCarsInput): Promise<ListCarsResult> {
    const limit = Math.min(input.limit || 20, 100);
    const offset = input.offset || 0;

    const filters: CarFilters = {
      ...input,
      limit,
      offset,
      sortBy: input.sortBy || 'created_at',
      sortOrder: input.sortOrder || 'desc',
      // Public (no status param) => 'active'; admin sends 'all' or specific status
      status: input.status === undefined ? 'active' : input.status,
    };

    const { cars, total } = await this.repository.findAll(filters);
    const page = Math.floor(offset / limit) + 1;

    return {
      cars,
      total,
      page,
      limit,
      hasMore: offset + cars.length < total,
    };
  }

  async getCarById(id: string): Promise<Car | null> {
    return this.repository.findById(id);
  }

  async createCar(input: CreateCarInput): Promise<Car> {
    const data: CreateCarData = {
      make: input.make,
      model: input.model,
      variant: input.variant,
      year: input.year,
      price: input.price,
      mileage: input.mileage,
      condition: input.condition,
      body_type: input.body_type,
      transmission: input.transmission,
      fuel_type: input.fuel_type,
      color: input.color,
      description: input.description,
      features: input.features,
      status: input.status ?? 'active',
      video_url: input.video_url,
    };
    return this.repository.create(data);
  }

  async updateCar(id: string, input: Partial<CreateCarInput>): Promise<Car | null> {
    const data: Partial<CreateCarData> = {};
    
    if (input.make !== undefined) data.make = input.make;
    if (input.model !== undefined) data.model = input.model;
    if (input.variant !== undefined) data.variant = input.variant;
    if (input.year !== undefined) data.year = input.year;
    if (input.price !== undefined) data.price = input.price;
    if (input.mileage !== undefined) data.mileage = input.mileage;
    if (input.condition !== undefined) data.condition = input.condition;
    if (input.body_type !== undefined) data.body_type = input.body_type;
    if (input.transmission !== undefined) data.transmission = input.transmission;
    if (input.fuel_type !== undefined) data.fuel_type = input.fuel_type;
    if (input.color !== undefined) data.color = input.color;
    if (input.description !== undefined) data.description = input.description;
    if (input.features !== undefined) data.features = input.features;
    if (input.status !== undefined) data.status = input.status;
    if (input.video_url !== undefined) data.video_url = input.video_url;

    return this.repository.update(id, data);
  }

  async deleteCar(id: string): Promise<boolean> {
    return this.repository.softDelete(id);
  }
}
