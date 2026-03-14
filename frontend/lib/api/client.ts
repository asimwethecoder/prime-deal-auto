// API Client for Prime Deal Auto Frontend
// Centralized fetch wrapper with error handling and authentication

import { ApiError, ApiResponse, ApiErrorResponse } from './types';

/**
 * Base API URL from environment variable
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ||
  'https://urwy8bxz7g.execute-api.us-east-1.amazonaws.com/v1';

/**
 * Get authentication token from Amplify session (if signed in)
 */
async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const { fetchAuthSession } = await import('aws-amplify/auth');
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString();
    return idToken ?? null;
  } catch {
    return null;
  }
}

/**
 * Generic fetch wrapper with error handling and authentication
 * 
 * @param endpoint - API endpoint (e.g., '/cars', '/cars/123')
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns Typed response data
 * @throws ApiError on network errors or non-2xx responses
 */
export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Merge custom headers from options
  if (options?.headers) {
    const customHeaders = new Headers(options.headers);
    customHeaders.forEach((value, key) => {
      headers[key] = value;
    });
  }

  // Add Authorization header if token exists
  const token = await getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    // Make the request
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle non-2xx responses
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorCode: string | undefined;

      // Try to parse error response
      try {
        const errorData: ApiErrorResponse = JSON.parse(errorText);
        if (errorData.error) {
          errorMessage = errorData.error;
          errorCode = errorData.code;
        }
      } catch {
        // If parsing fails, use the raw text
        if (errorText) {
          errorMessage = errorText;
        }
      }

      throw new ApiError(response.status, errorMessage, errorCode);
    }

    // Parse JSON response
    const data: ApiResponse<T> | ApiErrorResponse = await response.json();

    // Check for API-level errors (success: false)
    if (!data.success) {
      const errorData = data as ApiErrorResponse;
      throw new ApiError(response.status, errorData.error, errorData.code);
    }

    // Return the data payload
    return (data as ApiResponse<T>).data;
  } catch (error) {
    // Handle network errors
    if (error instanceof ApiError) {
      throw error;
    }

    // Network error or other fetch failure (e.g. backend not running, CORS, DNS)
    if (error instanceof TypeError) {
      throw new ApiError(
        0,
        'Unable to connect. Check that the API is running and NEXT_PUBLIC_API_URL is correct.'
      );
    }

    // Unknown error
    throw new ApiError(0, error instanceof Error ? error.message : 'Unknown error occurred');
  }
}

/**
 * Helper function for GET requests
 */
export async function get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
  // Build query string from params
  const queryString = params 
    ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([_, value]) => value !== undefined && value !== null)
          .map(([key, value]) => [key, String(value)])
      ).toString()
    : '';

  return fetchApi<T>(`${endpoint}${queryString}`, {
    method: 'GET',
  });
}

/**
 * Helper function for POST requests
 */
export async function post<T>(endpoint: string, body?: any): Promise<T> {
  return fetchApi<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Helper function for PUT requests
 */
export async function put<T>(endpoint: string, body?: any): Promise<T> {
  return fetchApi<T>(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Helper function for PATCH requests
 */
export async function patch<T>(endpoint: string, body?: any): Promise<T> {
  return fetchApi<T>(endpoint, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Helper function for DELETE requests
 */
export async function del<T>(endpoint: string): Promise<T> {
  return fetchApi<T>(endpoint, {
    method: 'DELETE',
  });
}
