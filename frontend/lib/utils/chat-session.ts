// Chat Session Token Management
// Handles localStorage persistence for anonymous chat sessions

const SESSION_TOKEN_KEY = 'chat_session_token';
const SESSION_ID_KEY = 'chat_session_id';

/**
 * Get stored session token for anonymous users
 */
export function getStoredSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

/**
 * Get stored session ID for anonymous users
 */
export function getStoredSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_ID_KEY);
}

/**
 * Store session credentials for anonymous users
 */
export function storeSessionCredentials(
  sessionId: string,
  sessionToken: string
): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_ID_KEY, sessionId);
  localStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
}

/**
 * Clear stored session credentials
 */
export function clearSessionCredentials(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_ID_KEY);
  localStorage.removeItem(SESSION_TOKEN_KEY);
}

/**
 * Check if user has stored session
 */
export function hasStoredSession(): boolean {
  return !!getStoredSessionToken() && !!getStoredSessionId();
}
