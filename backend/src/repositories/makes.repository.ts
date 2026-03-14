import { getPool } from '../lib/database';

export interface Make {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Model {
  id: string;
  make_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Variant {
  id: string;
  model_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export class MakesRepository {
  async findAllMakes(): Promise<Make[]> {
    const pool = await getPool();
    const result = await pool.query(
      `SELECT id, name, created_at, updated_at FROM car_makes ORDER BY name ASC`
    );
    return result.rows;
  }

  async createMake(name: string): Promise<Make> {
    const pool = await getPool();
    const result = await pool.query(
      `INSERT INTO car_makes (name) VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name, created_at, updated_at`,
      [name.trim()]
    );
    return result.rows[0];
  }

  async findModelsByMakeId(makeId: string): Promise<Model[]> {
    const pool = await getPool();
    const result = await pool.query(
      `SELECT id, make_id, name, created_at, updated_at 
       FROM car_models 
       WHERE make_id = $1 
       ORDER BY name ASC`,
      [makeId]
    );
    return result.rows;
  }

  async createModel(makeId: string, name: string): Promise<Model> {
    const pool = await getPool();
    const result = await pool.query(
      `INSERT INTO car_models (make_id, name) VALUES ($1, $2)
       ON CONFLICT (make_id, name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, make_id, name, created_at, updated_at`,
      [makeId, name.trim()]
    );
    return result.rows[0];
  }

  async findVariantsByModelId(modelId: string): Promise<Variant[]> {
    const pool = await getPool();
    const result = await pool.query(
      `SELECT id, model_id, name, created_at, updated_at 
       FROM car_variants 
       WHERE model_id = $1 
       ORDER BY name ASC`,
      [modelId]
    );
    return result.rows;
  }

  async createVariant(modelId: string, name: string): Promise<Variant> {
    const pool = await getPool();
    const result = await pool.query(
      `INSERT INTO car_variants (model_id, name) VALUES ($1, $2)
       ON CONFLICT (model_id, name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, model_id, name, created_at, updated_at`,
      [modelId, name.trim()]
    );
    return result.rows[0];
  }
}
