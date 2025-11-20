/**
 * Rate limiting for deployment operations
 * Prevents abuse and manages API quota
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting
// In production, use Redis or similar distributed cache
const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Default rate limit configurations for different operations
 */
export const RATE_LIMITS = {
  // Deployment operations: 10 deploys per hour per user
  deploy: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // Token operations: 20 requests per 15 minutes per user
  token: {
    maxRequests: 20,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // Status checks: 100 requests per 5 minutes per user
  status: {
    maxRequests: 100,
    windowMs: 5 * 60 * 1000, // 5 minutes
  },
  // Name availability checks: 50 requests per 5 minutes per user
  checkName: {
    maxRequests: 50,
    windowMs: 5 * 60 * 1000, // 5 minutes
  },
} as const

/**
 * Check if a request should be rate limited
 * Returns null if allowed, or an object with limit info if blocked
 */
export function checkRateLimit(
  userId: string,
  operation: keyof typeof RATE_LIMITS
): { allowed: boolean; limit: number; remaining: number; resetTime: number } {
  const config = RATE_LIMITS[operation]
  const key = `${userId}:${operation}`
  const now = Date.now()

  // Get or create rate limit entry
  let entry = rateLimitStore.get(key)

  // Reset if window has passed
  if (!entry || now >= entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    }
    rateLimitStore.set(key, entry)
  }

  // Increment count
  entry.count++

  // Check if limit exceeded
  const allowed = entry.count <= config.maxRequests
  const remaining = Math.max(0, config.maxRequests - entry.count)

  return {
    allowed,
    limit: config.maxRequests,
    remaining,
    resetTime: entry.resetTime,
  }
}

/**
 * Get rate limit info without incrementing the counter
 */
export function getRateLimitInfo(
  userId: string,
  operation: keyof typeof RATE_LIMITS
): { limit: number; remaining: number; resetTime: number } {
  const config = RATE_LIMITS[operation]
  const key = `${userId}:${operation}`
  const now = Date.now()

  const entry = rateLimitStore.get(key)

  if (!entry || now >= entry.resetTime) {
    return {
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
    }
  }

  const remaining = Math.max(0, config.maxRequests - entry.count)

  return {
    limit: config.maxRequests,
    remaining,
    resetTime: entry.resetTime,
  }
}

/**
 * Reset rate limit for a user and operation
 * Useful for testing or admin overrides
 */
export function resetRateLimit(
  userId: string,
  operation: keyof typeof RATE_LIMITS
): void {
  const key = `${userId}:${operation}`
  rateLimitStore.delete(key)
}

/**
 * Clean up expired rate limit entries
 * Should be called periodically (e.g., every hour)
 */
export function cleanupExpiredEntries(): number {
  const now = Date.now()
  let cleaned = 0

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetTime) {
      rateLimitStore.delete(key)
      cleaned++
    }
  }

  return cleaned
}

/**
 * Get rate limit headers for HTTP response
 */
export function getRateLimitHeaders(info: {
  limit: number
  remaining: number
  resetTime: number
}): Record<string, string> {
  return {
    'X-RateLimit-Limit': info.limit.toString(),
    'X-RateLimit-Remaining': info.remaining.toString(),
    'X-RateLimit-Reset': info.resetTime.toString(),
  }
}

/**
 * Create a rate limit error response
 */
export function createRateLimitError(info: {
  limit: number
  resetTime: number
}): { error: string; retryAfter: number } {
  const retryAfter = Math.ceil((info.resetTime - Date.now()) / 1000)

  return {
    error: `Rate limit exceeded. Maximum ${info.limit} requests allowed. Try again in ${retryAfter} seconds.`,
    retryAfter,
  }
}
