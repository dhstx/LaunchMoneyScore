import { TRPCError } from "@trpc/server";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const store: RateLimitStore = {};

/**
 * Simple in-memory rate limiter
 * @param key - Unique identifier (IP, user ID, API key)
 * @param limit - Max requests per window
 * @param windowMs - Time window in milliseconds
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const record = store[key];

  if (!record || now > record.resetAt) {
    // New window
    store[key] = {
      count: 1,
      resetAt: now + windowMs,
    };
    return;
  }

  if (record.count >= limit) {
    const resetInSeconds = Math.ceil((record.resetAt - now) / 1000);
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Rate limit exceeded. Try again in ${resetInSeconds} seconds.`,
    });
  }

  record.count++;
}

/**
 * Clean up expired entries (run periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetAt < now) {
      delete store[key];
    }
  });
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);

