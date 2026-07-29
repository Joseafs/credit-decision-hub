import { describe, expect, test } from "vitest";

import { hashPassword, verifyPassword } from "./password.js";

describe("password", () => {
  test("should hash and verify a password without storing plaintext", async () => {
    const password = "demo-password-123";
    const hash = await hashPassword(password);

    expect(hash).not.toContain(password);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });
});
