import type { User } from "@credit-decision-hub/contracts";
import { afterAll, describe, expect, test, vi } from "vitest";

import { buildApp } from "../../app.js";
import type { UserService } from "./user.service.js";

const createdAt = "2026-07-29T12:00:00.000Z";
const users: Record<string, User> = {
  "admin@example.test": {
    id: "507f1f77bcf86cd799439011",
    name: "Admin Demo",
    email: "admin@example.test",
    role: "admin",
    active: true,
    createdAt,
  },
  "analyst@example.test": {
    id: "507f1f77bcf86cd799439012",
    name: "Analyst Demo",
    email: "analyst@example.test",
    role: "analyst",
    active: true,
    createdAt,
  },
};

const userService: UserService = {
  authenticate: vi.fn(async ({ email }) => users[email]!),
  createAnalyst: vi.fn(async () => users["analyst@example.test"]!),
  getActiveById: vi.fn(
    async (id) => Object.values(users).find((user) => user.id === id) ?? null,
  ),
  list: vi.fn(async () => Object.values(users)),
};

const app = buildApp({
  authentication: {
    secret: "test-secret-with-at-least-32-characters",
    secureCookie: false,
    userService,
  },
});

afterAll(async () => app.close());

const loginAs = async (email: string) => {
  const response = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: { email, password: "demo-password" },
  });
  return response.cookies[0]!;
};

describe("authentication routes", () => {
  test("should reject a protected request without a session", async () => {
    const response = await app.inject({ method: "GET", url: "/customers" });
    expect(response.statusCode).toBe(401);
  });

  test("should create an HttpOnly cookie and restore the session", async () => {
    const cookie = await loginAs("analyst@example.test");
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.sameSite).toBe("Lax");

    const response = await app.inject({
      method: "GET",
      url: "/auth/session",
      cookies: { [cookie.name]: cookie.value },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().user.role).toBe("analyst");
  });

  test("should forbid analysts and allow administrators on user management", async () => {
    const analystCookie = await loginAs("analyst@example.test");
    const forbidden = await app.inject({
      method: "GET",
      url: "/users",
      cookies: { [analystCookie.name]: analystCookie.value },
    });
    expect(forbidden.statusCode).toBe(403);

    const adminCookie = await loginAs("admin@example.test");
    const allowed = await app.inject({
      method: "GET",
      url: "/users",
      cookies: { [adminCookie.name]: adminCookie.value },
    });
    expect(allowed.statusCode).toBe(200);
    expect(allowed.json()).toHaveLength(2);
  });
});
