import type {
  AuditEventListResponse,
  DashboardSummary,
  User,
} from "@credit-decision-hub/contracts";
import { afterAll, describe, expect, test, vi } from "vitest";

import { buildApp } from "../../app.js";
import type { UserService } from "../users/user.service.js";
import type { DashboardService } from "./dashboard.service.js";

const user: User = {
  id: "650000000000000000000001",
  name: "Analista Demo",
  email: "analyst@example.test",
  role: "analyst",
  active: true,
  createdAt: "2026-07-29T12:00:00.000Z",
};

const summary: DashboardSummary = {
  totalProposals: 10,
  totalRequestedAmount: 250_000,
  approvalRate: 50,
  pendingActionCount: 2,
  manualDecisionCount: 3,
  myDecisionCount: 1,
  statusDistribution: [
    { status: "pending", count: 0 },
    { status: "approved", count: 5 },
    { status: "rejected", count: 3 },
    { status: "manual_review", count: 1 },
    { status: "pending_documents", count: 0 },
    { status: "fraud_suspected", count: 1 },
  ],
  riskDistribution: [
    { riskLevel: "low", count: 5 },
    { riskLevel: "medium", count: 3 },
    { riskLevel: "high", count: 2 },
  ],
};

const auditPage: AuditEventListResponse = {
  data: [
    {
      id: "670000000000000000000001",
      proposalId: "660000000000000000000001",
      actorId: user.id,
      actorName: user.name,
      fromStatus: "manual_review",
      toStatus: "approved",
      reasonCode: "manual_approval",
      reason: "Documentação conferida",
      createdAt: "2026-07-29T13:00:00.000Z",
    },
  ],
  pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
};

const dashboardService: DashboardService = {
  getSummary: vi.fn(async () => summary),
  listAuditEvents: vi.fn(async () => auditPage),
};

const userService: UserService = {
  authenticate: vi.fn(async () => user),
  createAnalyst: vi.fn(),
  getActiveById: vi.fn(async () => user),
  list: vi.fn(),
};

const app = buildApp({
  dashboardService,
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

describe("dashboard routes", () => {
  test("should reject dashboard access without an authenticated session", async () => {
    const response = await app.inject({ method: "GET", url: "/dashboard" });

    expect(response.statusCode).toBe(401);
  });

  test("should return operational indicators for the authenticated user", async () => {
    const cookie = await login();
    const response = await app.inject({
      method: "GET",
      url: "/dashboard",
      cookies: { [cookie.name]: cookie.value },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(summary);
    expect(dashboardService.getSummary).toHaveBeenCalledWith(user.id);
  });

  test("should return paginated manual decision audit events", async () => {
    const cookie = await login();
    const response = await app.inject({
      method: "GET",
      url: "/audit-events?page=1&limit=10",
      cookies: { [cookie.name]: cookie.value },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(auditPage);
    expect(dashboardService.listAuditEvents).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
    });
  });
});
