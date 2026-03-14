import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { success, error } from '../lib/response';
import { MakesRepository } from '../repositories/makes.repository';

const makesRepository = new MakesRepository();

// Validation schemas
const createMakeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
});

const createModelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
});

const createVariantSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
});

/**
 * GET /makes - Get all car makes
 */
export async function handleGetMakes(
  _event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const makes = await makesRepository.findAllMakes();
    return success(makes);
  } catch (err) {
    console.error('Error fetching makes:', err);
    return error('Failed to fetch makes', 'INTERNAL_ERROR', 500);
  }
}

/**
 * POST /makes - Create a new car make (admin only)
 */
export async function handleCreateMake(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || '{}');
    const parsed = createMakeSchema.safeParse(body);

    if (!parsed.success) {
      return error(parsed.error.errors[0].message, 'VALIDATION_ERROR', 400);
    }

    const make = await makesRepository.createMake(parsed.data.name);
    return success(make, 201);
  } catch (err) {
    console.error('Error creating make:', err);
    return error('Failed to create make', 'INTERNAL_ERROR', 500);
  }
}

/**
 * GET /makes/:makeId/models - Get all models for a make
 */
export async function handleGetModels(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const makeId = event.pathParameters?.makeId;
    if (!makeId) {
      return error('Make ID is required', 'VALIDATION_ERROR', 400);
    }

    const models = await makesRepository.findModelsByMakeId(makeId);
    return success(models);
  } catch (err) {
    console.error('Error fetching models:', err);
    return error('Failed to fetch models', 'INTERNAL_ERROR', 500);
  }
}

/**
 * POST /makes/:makeId/models - Create a new model for a make (admin only)
 */
export async function handleCreateModel(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const makeId = event.pathParameters?.makeId;
    if (!makeId) {
      return error('Make ID is required', 'VALIDATION_ERROR', 400);
    }

    const body = JSON.parse(event.body || '{}');
    const parsed = createModelSchema.safeParse(body);

    if (!parsed.success) {
      return error(parsed.error.errors[0].message, 'VALIDATION_ERROR', 400);
    }

    const model = await makesRepository.createModel(makeId, parsed.data.name);
    return success(model, 201);
  } catch (err) {
    console.error('Error creating model:', err);
    return error('Failed to create model', 'INTERNAL_ERROR', 500);
  }
}

/**
 * GET /models/:modelId/variants - Get all variants for a model
 */
export async function handleGetVariants(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const modelId = event.pathParameters?.modelId;
    if (!modelId) {
      return error('Model ID is required', 'VALIDATION_ERROR', 400);
    }

    const variants = await makesRepository.findVariantsByModelId(modelId);
    return success(variants);
  } catch (err) {
    console.error('Error fetching variants:', err);
    return error('Failed to fetch variants', 'INTERNAL_ERROR', 500);
  }
}

/**
 * POST /models/:modelId/variants - Create a new variant for a model (admin only)
 */
export async function handleCreateVariant(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const modelId = event.pathParameters?.modelId;
    if (!modelId) {
      return error('Model ID is required', 'VALIDATION_ERROR', 400);
    }

    const body = JSON.parse(event.body || '{}');
    const parsed = createVariantSchema.safeParse(body);

    if (!parsed.success) {
      return error(parsed.error.errors[0].message, 'VALIDATION_ERROR', 400);
    }

    const variant = await makesRepository.createVariant(modelId, parsed.data.name);
    return success(variant, 201);
  } catch (err) {
    console.error('Error creating variant:', err);
    return error('Failed to create variant', 'INTERNAL_ERROR', 500);
  }
}
