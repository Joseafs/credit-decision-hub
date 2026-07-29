import { healthResponseSchema } from "@credit-decision-hub/contracts";
import { afterAll, describe, expect, test } from "vitest";

import { buildApp } from "../../app.js";

const app = buildApp();

afterAll(async () => {
  await app.close();
});

describe("GET /health", () => {
  test("should return the API health status", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    expect(healthResponseSchema.parse(response.json())).toEqual({
      status: "ok",
      service: "credit-decision-api",
    });
  });
});
