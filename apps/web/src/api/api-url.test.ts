import { describe, expect, test } from "vitest";

import { resolveApiUrl } from "./api-url";

describe("resolveApiUrl", () => {
  test("should preserve the development proxy path without a configured origin", () => {
    expect(resolveApiUrl("/api/health", null)).toBe("/api/health");
  });

  test("should replace the development prefix with the hosted API origin", () => {
    expect(
      resolveApiUrl(
        "/api/analytics/summary",
        "https://credit-decision-api.onrender.com/",
      ),
    ).toBe("https://credit-decision-api.onrender.com/analytics/summary");
  });

  test("should reject an API origin containing a path", () => {
    expect(() =>
      resolveApiUrl("/api/health", "https://api.example.test/v1"),
    ).toThrow("VITE_API_URL must contain only protocol and host");
  });
});
