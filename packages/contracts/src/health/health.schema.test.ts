import { describe, expect, test } from "vitest";

import { healthResponseSchema } from "./health.schema";

describe("healthResponseSchema", () => {
  test("should accept the API health response", () => {
    const result = healthResponseSchema.safeParse({
      status: "ok",
      service: "credit-decision-api",
    });

    expect(result.success).toBe(true);
  });

  test("should reject an unexpected service response", () => {
    const result = healthResponseSchema.safeParse({
      status: "ok",
      service: "another-service",
    });

    expect(result.success).toBe(false);
  });
});
