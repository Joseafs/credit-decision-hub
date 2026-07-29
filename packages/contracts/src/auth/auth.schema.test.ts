import { describe, expect, test } from "vitest";

import { loginSchema } from "./auth.schema.js";

describe("auth contracts", () => {
  test("should normalize a valid login email", () => {
    expect(
      loginSchema.parse({
        email: " ANALYST@EXAMPLE.TEST ",
        password: "secret",
      }),
    ).toEqual({ email: "analyst@example.test", password: "secret" });
  });

  test("should reject unexpected login fields", () => {
    expect(() =>
      loginSchema.parse({
        email: "analyst@example.test",
        password: "secret",
        role: "admin",
      }),
    ).toThrow();
  });
});
