import { RateLimiter, RateLimiterOptions, RateLimiterResult } from "../common/rate_limiter";
import { logger } from "../common/logger";

export class ApiRateLimiter extends RateLimiter {
  constructor(options: RateLimiterOptions) {
    super(options);
  }

  override isAllowed(identifier: string): RateLimiterResult {
    const result = super.isAllowed(identifier);

    if (!result.allowed) {
      logger.warn(`[RateLimiter] API limit exceeded for ${identifier}.`);
    } else {
      logger.debug(
        `[RateLimiter] API request allowed for ${identifier}. Remaining: ${result.remaining}`
      );
    }

    return result;
  }

  updateMaxRequests(maxRequests: number) {
    (this as any).maxRequests = maxRequests;
    logger.info(`[RateLimiter] Updated maxRequests to ${maxRequests}`);
  }

  updateWindow(windowMs: number) {
    (this as any).windowMs = windowMs;
    logger.info(`[RateLimiter] Updated windowMs to ${windowMs}ms`);
  }
}

export function rate_limiter(options: RateLimiterOptions): ApiRateLimiter {
  return new ApiRateLimiter(options);
}
