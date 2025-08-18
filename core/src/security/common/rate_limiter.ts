export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (identifier: string) => string;
  algorithm?: "fixed" | "sliding";
}

export interface RateLimiterResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number;
}

export interface RateLimiterEntry {
  count: number;
  expiresAt: number;
  lastRequestAt: number;
}

export class RateLimiter {
  private storage: Map<string, RateLimiterEntry> = new Map();
  private windowMs: number;
  private maxRequests: number;
  private keyGenerator: (identifier: string) => string;
  private algorithm: "fixed" | "sliding";

  constructor(options: RateLimiterOptions) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.keyGenerator = options.keyGenerator || ((id) => id);
    this.algorithm = options.algorithm || "fixed";
  }

  isAllowed(identifier: string): RateLimiterResult {
    const key = this.keyGenerator(identifier);
    const now = Date.now();

    let entry = this.storage.get(key);

    if (!entry || now > entry.expiresAt) {
      entry = {
        count: 1,
        expiresAt: now + this.windowMs,
        lastRequestAt: now,
      };
      this.storage.set(key, entry);
      return { allowed: true, remaining: this.maxRequests - 1 };
    }

    if (this.algorithm === "fixed") {
      if (entry.count < this.maxRequests) {
        entry.count += 1;
        this.storage.set(key, entry);
        return { allowed: true, remaining: this.maxRequests - entry.count };
      }
    } else if (this.algorithm === "sliding") {
      const elapsed = now - entry.lastRequestAt;
      const decay = Math.floor(elapsed / this.windowMs) * this.maxRequests;

      entry.count = Math.max(0, entry.count - decay);
      entry.lastRequestAt = now;

      if (entry.count < this.maxRequests) {
        entry.count += 1;
        this.storage.set(key, entry);
        return { allowed: true, remaining: this.maxRequests - entry.count };
      }
    }

    const retryAfter = Math.ceil((entry.expiresAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  reset(identifier: string) {
    const key = this.keyGenerator(identifier);
    this.storage.delete(key);
  }

  clear() {
    this.storage.clear();
  }
}
