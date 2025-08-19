import { logger } from "../common/logger";

export interface QuotaOptions {
  maxQuota: number;
  windowMs: number;
}

export interface QuotaResult {
  allowed: boolean;
  used: number;
  remaining: number;
  resetTime: number;
  identifier: string;
  reason?: string;
}

export class QuotaManager {
  private maxQuota: number;
  private windowMs: number;
  private usage: Map<string, { used: number; resetTime: number }> = new Map();

  constructor(options: QuotaOptions) {
    this.maxQuota = options.maxQuota;
    this.windowMs = options.windowMs;
    logger.info(
      `QuotaManager initialized with maxQuota=${options.maxQuota}, windowMs=${options.windowMs}`
    );
  }

  checkQuota(identifier: string, amount: number = 1): QuotaResult {
    const now = Date.now();
    const entry = this.usage.get(identifier);

    if (!entry || now > entry.resetTime) {
      const resetTime = now + this.windowMs;
      this.usage.set(identifier, { used: amount, resetTime });

      logger.debug(
        `Quota reset/initialized for identifier=${identifier}, used=${amount}, remaining=${
          this.maxQuota - amount
        }`
      );

      return {
        allowed: true,
        used: amount,
        remaining: this.maxQuota - amount,
        resetTime,
        identifier,
      };
    }

    if (entry.used + amount <= this.maxQuota) {
      entry.used += amount;

      logger.debug(
        `Quota allowed for identifier=${identifier}, used=${
          entry.used
        }, remaining=${this.maxQuota - entry.used}`
      );

      return {
        allowed: true,
        used: entry.used,
        remaining: this.maxQuota - entry.used,
        resetTime: entry.resetTime,
        identifier,
      };
    }

    logger.warn(
      `Quota exceeded for identifier=${identifier}, used=${entry.used}, maxQuota=${this.maxQuota}`
    );

    return {
      allowed: false,
      used: entry.used,
      remaining: 0,
      resetTime: entry.resetTime,
      identifier,
      reason: "Quota exceeded",
    };
  }

  updateMaxQuota(maxQuota: number) {
    this.maxQuota = maxQuota;
    logger.info(`Updated QuotaManager maxQuota to ${maxQuota}`);
  }

  updateWindow(windowMs: number) {
    this.windowMs = windowMs;
    logger.info(`Updated QuotaManager windowMs to ${windowMs}`);
  }
}

export function quota(options: QuotaOptions): QuotaManager {
  return new QuotaManager(options);
}
