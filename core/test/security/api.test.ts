import { describe, it, expect, beforeEach } from "vitest";
import Akeno from "../../src/index";
import type {
  ApiRateLimiter,
  QuotaManager,
  HeaderValidator,
  ReplayPrevention,
} from "../../src/security/api/api";

const apiModule = Akeno.Security.APIModule;

describe("API Security Module Tests", () => {
  let rateLimiter: ApiRateLimiter;
  let quotaManager: QuotaManager;
  let headerValidator: HeaderValidator;
  let replayPrevention: ReplayPrevention;

  beforeEach(() => {
    rateLimiter = new apiModule.ApiRateLimiter({
      windowMs: 1000,
      maxRequests: 3,
    });
    quotaManager = new apiModule.QuotaManager({ maxQuota: 5, windowMs: 5000 });
    headerValidator = new apiModule.HeaderValidator({
      requiredHeaders: ["x-api-key", "x-timestamp", "x-signature"],
      hmacSecret: "testsecret",
    });
    replayPrevention = new apiModule.ReplayPrevention({
      secret: "testsecret",
      windowMs: 5000,
    });
  });

  it("should allow requests under rate limit", () => {
    const id = "client1";
    expect(rateLimiter.isAllowed(id).allowed).toBe(true);
    expect(rateLimiter.isAllowed(id).allowed).toBe(true);
    expect(rateLimiter.isAllowed(id).allowed).toBe(true);
    expect(rateLimiter.isAllowed(id).allowed).toBe(false);
  });

  it("should correctly track quotas", () => {
    const id = "client2";
    expect(quotaManager.checkQuota(id).allowed).toBe(true);
    expect(quotaManager.checkQuota(id, 4).allowed).toBe(true);
    const res = quotaManager.checkQuota(id, 1);
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe("Quota exceeded");
  });

  it("should validate headers correctly", () => {
    const timestamp = Date.now();
    const body = "payload";
    const signature = require("crypto")
      .createHmac("sha256", "testsecret")
      .update(`${timestamp}:${body}`)
      .digest("hex");

    const validHeaders = {
      "x-api-key": "key123",
      "x-timestamp": timestamp.toString(),
      "x-signature": signature,
    };

    const result = headerValidator.validate(validHeaders, body);
    expect(result.valid).toBe(true);

    const invalidHeaders = { ...validHeaders, "x-signature": "bad" };
    const failResult = headerValidator.validate(invalidHeaders, body);
    expect(failResult.valid).toBe(false);
  });

  it("should prevent replay attacks", () => {
    const timestamp = Date.now();
    const payload = "data";
    const sig = require("crypto")
      .createHmac("sha256", "testsecret")
      .update(`${payload}:${timestamp}`)
      .digest("hex");

    const id = "user1";
    const firstAttempt = replayPrevention.verify(id, payload, timestamp, sig);
    expect(firstAttempt.allowed).toBe(true);

    const secondAttempt = replayPrevention.verify(id, payload, timestamp, sig);
    expect(secondAttempt.allowed).toBe(false);
    expect(secondAttempt.reason).toBe("Signature already used");
  });
});
