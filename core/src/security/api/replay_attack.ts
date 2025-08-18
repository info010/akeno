import crypto from "crypto";
import { logger } from "../../utils/logger";

export interface ReplayOptions {
  secret: string;
  windowMs: number;
  storeSize?: number;
}

export interface ReplayResult {
  allowed: boolean;
  identifier: string;
  reason?: string;
}

export class ReplayPrevention {
  private secret: string;
  private windowMs: number;
  private storeSize: number;
  private seenSignatures: Map<string, number> = new Map();

  constructor(options: ReplayOptions) {
    this.secret = options.secret;
    this.windowMs = options.windowMs;
    this.storeSize = options.storeSize || 1000;
  }

  verify(
    identifier: string,
    payload: string,
    timestamp: number,
    signature: string
  ): ReplayResult {
    const now = Date.now();

    if (Math.abs(now - timestamp) > this.windowMs) {
      logger.warn(`Replay rejected (stale timestamp) for ${identifier}`);
      return {
        allowed: false,
        identifier,
        reason: "Invalid or expired timestamp",
      };
    }

    const expectedSig = crypto
      .createHmac("sha256", this.secret)
      .update(`${payload}:${timestamp}`)
      .digest("hex");

    if (
      !crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(signature))
    ) {
      logger.warn(`Replay rejected (invalid signature) for ${identifier}`);
      return { allowed: false, identifier, reason: "Invalid signature" };
    }

    if (this.seenSignatures.has(signature)) {
      logger.warn(`Replay rejected (reused signature) for ${identifier}`);
      return { allowed: false, identifier, reason: "Signature already used" };
    }

    this.seenSignatures.set(signature, now);

    if (this.seenSignatures.size > this.storeSize) {
      const oldestKey = [...this.seenSignatures.keys()][0];
      this.seenSignatures.delete(oldestKey);
    }

    logger.debug(`Replay check passed for ${identifier}`);
    return { allowed: true, identifier };
  }

  clear() {
    this.seenSignatures.clear();
    logger.info("Replay signature store cleared");
  }
}

export function replayPrevention(options: ReplayOptions): ReplayPrevention {
  return new ReplayPrevention(options);
}
