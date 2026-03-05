/**
 * Rate Limiter for chat messages
 * Enforces 10 messages per minute per session
 * Tracks counts in memory within Lambda execution context
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitEntry>;
  private readonly maxMessages: number;
  private readonly windowMs: number;

  constructor(maxMessages: number = 10, windowSeconds: number = 60) {
    this.limits = new Map();
    this.maxMessages = maxMessages;
    this.windowMs = windowSeconds * 1000;
  }

  /**
   * Check if a request is allowed for the given session
   * @param sessionId - The session ID to check
   * @returns RateLimitResult with allowed status and optional retryAfter
   */
  checkLimit(sessionId: string): RateLimitResult {
    const now = Date.now();
    const entry = this.limits.get(sessionId);

    // No entry or expired window - allow and create new entry
    if (!entry || now >= entry.resetTime) {
      this.limits.set(sessionId, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return { allowed: true };
    }

    // Within window - check count
    if (entry.count < this.maxMessages) {
      entry.count++;
      return { allowed: true };
    }

    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      allowed: false,
      retryAfter,
    };
  }

  /**
   * Clean up expired entries (optional, for memory management)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [sessionId, entry] of this.limits.entries()) {
      if (now >= entry.resetTime) {
        this.limits.delete(sessionId);
      }
    }
  }
}

// Singleton instance for reuse across warm Lambda invocations
let rateLimiterInstance: RateLimiter | null = null;

/**
 * Get or create rate limiter instance
 */
export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter();
  }
  return rateLimiterInstance;
}
