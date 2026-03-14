// Makes, Models, Variants API Module
// Functions for managing car makes, models, and variants

import { get, post } from './client';

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

/**
 * Fetch all car makes
 */
export async function getMakes(): Promise<Make[]> {
  return get<Make[]>('/makes');
}

/**
 * Create a new car make
 */
export async function createMake(name: string): Promise<Make> {
  return post<Make>('/makes', { name });
}

/**
 * Fetch all models for a specific make
 */
export async function getModels(makeId: string): Promise<Model[]> {
  return get<Model[]>(`/makes/${makeId}/models`);
}

/**
 * Create a new model for a make
 */
export async function createModel(makeId: string, name: string): Promise<Model> {
  return post<Model>(`/makes/${makeId}/models`, { name });
}

/**
 * Fetch all variants for a specific model
 */
export async function getVariants(modelId: string): Promise<Variant[]> {
  return get<Variant[]>(`/models/${modelId}/variants`);
}

/**
 * Create a new variant for a model
 */
export async function createVariant(modelId: string, name: string): Promise<Variant> {
  return post<Variant>(`/models/${modelId}/variants`, { name });
}
