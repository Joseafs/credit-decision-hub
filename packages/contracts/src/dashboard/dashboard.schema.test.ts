import { describe, expect, test } from "vitest";

import {
  auditEventListResponseSchema,
  dashboardSummarySchema,
  listAuditEventsQuerySchema,
} from "./dashboard.schema.js";

const statusDistribution = [
  { status: "pending", count: 0 },
  { status: "approved", count: 10 },
  { status: "rejected", count: 4 },
  { status: "manual_review", count: 2 },
  { status: "pending_documents", count: 1 },
  { status: "fraud_suspected", count: 1 },
] as const;

const riskDistribution = [
  { riskLevel: "low", count: 10 },
  { riskLevel: "medium", count: 4 },
  { riskLevel: "high", count: 4 },
] as const;

describe("dashboard contracts", () => {
  test("should validate the complete operational summary", () => {
    expect(
      dashboardSummarySchema.parse({
        totalProposals: 18,
        totalRequestedAmount: 450_000,
        approvalRate: 55.56,
        pendingActionCount: 4,
        manualDecisionCount: 3,
        myDecisionCount: 1,
        statusDistribution,
        riskDistribution,
      }),
    ).toEqual({
      totalProposals: 18,
      totalRequestedAmount: 450_000,
      approvalRate: 55.56,
      pendingActionCount: 4,
      manualDecisionCount: 3,
      myDecisionCount: 1,
      statusDistribution,
      riskDistribution,
    });
  });

  test("should reject internal fields in a strict dashboard response", () => {
    expect(() =>
      dashboardSummarySchema.parse({
        totalProposals: 0,
        totalRequestedAmount: 0,
        approvalRate: 0,
        pendingActionCount: 0,
        manualDecisionCount: 0,
        myDecisionCount: 0,
        statusDistribution,
        riskDistribution,
        internalAggregationId: "private",
      }),
    ).toThrow();
  });

  test("should reject a distribution with duplicated canonical values", () => {
    expect(() =>
      dashboardSummarySchema.parse({
        totalProposals: 0,
        totalRequestedAmount: 0,
        approvalRate: 0,
        pendingActionCount: 0,
        manualDecisionCount: 0,
        myDecisionCount: 0,
        statusDistribution: statusDistribution.map((metric, index) =>
          index === 0 ? { ...metric, status: "approved" } : metric,
        ),
        riskDistribution,
      }),
    ).toThrow("A distribuição deve conter cada status uma única vez");
  });

  test("should parse audit pagination and validate manual events", () => {
    expect(
      listAuditEventsQuerySchema.parse({ page: "2", limit: "10" }),
    ).toEqual({ page: 2, limit: 10 });

    expect(
      auditEventListResponseSchema.parse({
        data: [
          {
            id: "670000000000000000000001",
            proposalId: "660000000000000000000001",
            actorId: "650000000000000000000001",
            actorName: "Analista Demo",
            fromStatus: "manual_review",
            toStatus: "approved",
            reasonCode: "manual_approval",
            reason: "Documentação conferida",
            createdAt: "2026-07-29T12:00:00.000Z",
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      }).data,
    ).toHaveLength(1);
  });
});
