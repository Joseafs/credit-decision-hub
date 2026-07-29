import { describe, expect, test } from "vitest";

import { createUserSchema } from "./user.schema.js";

describe("user contracts", () => {
  test("should only accept analyst creation with a strong password", () => {
    expect(
      createUserSchema.parse({
        name: "Analista Demo",
        email: "analyst@example.test",
        password: "demo-password-123",
      }).role,
    ).toBe("analyst");
    expect(() =>
      createUserSchema.parse({
        name: "Admin",
        email: "admin@example.test",
        password: "demo-password-123",
        role: "admin",
      }),
    ).toThrow();
  });
});
