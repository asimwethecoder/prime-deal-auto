import { CarRepository, CarFilters } from '../repositories/cars.repository';
import { Car } from '../types';

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
      status: 'active', // Public endpoint always filters active
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
}
