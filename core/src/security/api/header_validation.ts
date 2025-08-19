import crypto from "crypto";
import { logger } from "../common/logger";

export interface HeaderValidationOptions {
  requiredHeaders: string[];
  allowedDriftMs?: number;
  hmacSecret?: string;
}

export interface HeaderValidationResult {
  valid: boolean;
  missing?: string[];
  reason?: string;
}

export class HeaderValidator {
  private requiredHeaders: string[];
  private allowedDriftMs: number;
  private hmacSecret?: string;

  constructor(options: HeaderValidationOptions) {
    this.requiredHeaders = options.requiredHeaders;
    this.allowedDriftMs = options.allowedDriftMs ?? 5 * 60 * 1000;
    this.hmacSecret = options.hmacSecret;
  }

  validate(
    headers: Record<string, string | undefined>,
    body: string = ""
  ): HeaderValidationResult {
    const missing = this.requiredHeaders.filter((h) => !headers[h]);
    if (missing.length > 0) {
      logger.warn(`Missing required headers: ${missing.join(", ")}`);
      return { valid: false, missing, reason: "Missing required headers" };
    }

    const timestamp = Number(headers["x-timestamp"]);
    if (isNaN(timestamp)) {
      return { valid: false, reason: "Invalid timestamp format" };
    }

    const now = Date.now();
    if (Math.abs(now - timestamp) > this.allowedDriftMs) {
      return { valid: false, reason: "Timestamp drift too high" };
    }

    if (this.hmacSecret) {
      const signature = headers["x-signature"];
      if (!signature) {
        return { valid: false, reason: "Missing signature" };
      }

      const expected = crypto
        .createHmac("sha256", this.hmacSecret)
        .update(`${timestamp}:${body}`)
        .digest("hex");

      if (expected !== signature) {
        logger.warn(
          `Invalid signature for request with timestamp ${timestamp}`
        );
        return { valid: false, reason: "Invalid signature" };
      }
    }

    logger.debug("Header validation successful");
    return { valid: true };
  }
}

export function header_validation(
  options: HeaderValidationOptions
): HeaderValidator {
  return new HeaderValidator(options);
}
