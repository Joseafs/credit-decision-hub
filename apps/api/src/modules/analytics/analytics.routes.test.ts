import type { AnalyticsSummary, User } from "@credit-decision-hub/contracts";
import { afterAll, describe, expect, test, vi } from "vitest";

import { buildApp } from "../../app.js";
import type { UserService } from "../users/user.service.js";
import {
  AnalyticsUnavailableError,
  type AnalyticsService,
} from "./analytics.service.js";

const user: User = {
  id: "650000000000000000000001",
  name: "Analista Demo",
  email: "analyst@example.test",
  role: "analyst",
  active: true,
  createdAt: "2026-07-29T12:00:00.000Z",
};

const summary: AnalyticsSummary = {
  source: "databricks",
  datasetVersion: "1",
  totalProposals: 1_000,
  approvedProposals: 200,
  approvalRate: 20,
  totalRequestedAmount: 70_816_365.76,
  averageRequestedAmount: 70_816.37,
  averageIncomeCommitment: 11.09,
};

const analyticsService: AnalyticsService = {
  getSummary: vi.fn(async () => summary),
};

const userService: UserService = {
  authenticate: vi.fn(async () => user),
  createAnalyst: vi.fn(),
  getActiveById: vi.fn(async () => user),
  list: vi.fn(),
};

const app = buildApp({
  analyticsService,
  authentication: {
    secret: "test-secret-with-at-least-32-characters",
    secureCookie: false,
    userService,
  },
});

afterAll(async () => app.close());

const login = async () => {
  const response = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: { email: user.email, password: "demo-password" },
  });

  return response.cookies[0]!;
};

describe("analytics routes", () => {
  test("should reject analytical access without authentication", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/analytics/summary",
    });

    expect(response.statusCode).toBe(401);
  });

  test("should return the Databricks analytical summary", async () => {
    const cookie = await login();
    const response = await app.inject({
      method: "GET",
      url: "/analytics/summary",
      cookies: { [cookie.name]: cookie.value },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(summary);
  });

  test("should isolate an unavailable analytical provider", async () => {
    const unavailableApp = buildApp({
      analyticsService: {
        getSummary: vi.fn(async () => {
          throw new AnalyticsUnavailableError();
        }),
      },
      authentication: {
        secret: "test-secret-with-at-least-32-characters",
        secureCookie: false,
        userService,
      },
    });
    const cookie = await login();
    const response = await unavailableApp.inject({
      method: "GET",
      url: "/analytics/summary",
      cookies: { [cookie.name]: cookie.value },
    });
    await unavailableApp.close();

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      message: "Indicadores analíticos temporariamente indisponíveis",
    });
  });
});
