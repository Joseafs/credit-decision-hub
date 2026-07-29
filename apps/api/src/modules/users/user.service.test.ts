import type { User } from "@credit-decision-hub/contracts";
import { beforeAll, describe, expect, test, vi } from "vitest";

import { InvalidCredentialsError } from "./user.errors.js";
import { hashPassword } from "./password.js";
import type { UserCredentials, UserRepository } from "./user.repository.js";
import { createUserService } from "./user.service.js";

const password = "valid-demo-password";
const user: User = {
  id: "507f1f77bcf86cd799439011",
  name: "Admin Demo",
  email: "admin@example.test",
  role: "admin",
  active: true,
  createdAt: "2026-07-29T12:00:00.000Z",
};

let credentials: UserCredentials;

beforeAll(async () => {
  credentials = {
    user,
    passwordHash: await hashPassword(password),
  };
});

const createRepository = (): UserRepository => ({
  create: vi.fn(),
  findByEmailWithPassword: vi.fn(async () => credentials),
  findById: vi.fn(),
  list: vi.fn(),
});

describe("user service", () => {
  test("should authenticate and return only the public user contract", async () => {
    const service = createUserService(createRepository());

    const authenticatedUser = await service.authenticate({
      email: user.email,
      password,
    });

    expect(authenticatedUser).toEqual(user);
    expect(authenticatedUser).not.toHaveProperty("passwordHash");
  });

  test("should reject invalid credentials", async () => {
    const service = createUserService(createRepository());

    await expect(
      service.authenticate({
        email: user.email,
        password: "invalid-demo-password",
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });
});
