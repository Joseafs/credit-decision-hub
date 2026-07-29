import { describe, expect, test } from "vitest";

import {
  analyticsProposalSchema,
  type AnalyticsProposal,
} from "./analytics-proposal.schema.js";

const validProposal: AnalyticsProposal = {
  exportVersion: "1",
  proposalId: "507f1f77bcf86cd799439011",
  customerId: "507f1f77bcf86cd799439012",
  createdAt: "2026-07-29T17:00:00.000Z",
  updatedAt: "2026-07-29T17:00:01.000Z",
  requestedAmount: 60_000,
  installments: 24,
  estimatedInstallment: 2_500,
  monthlyIncome: 10_000,
  occupation: "Analista de sistemas",
  score: 750,
  incomeCommitment: 25,
  risk: "low",
  status: "approved",
  decisionReason: "eligible",
};

describe("analytics proposal contract", () => {
  test("should accept a complete analytical proposal", () => {
    expect(analyticsProposalSchema.parse(validProposal)).toEqual(validProposal);
  });

  test("should reject unknown and sensitive fields", () => {
    const result = analyticsProposalSchema.safeParse({
      ...validProposal,
      name: "Cliente",
      document: "00000000000",
      _id: validProposal.proposalId,
    });

    expect(result.success).toBe(false);
  });

  test("should reuse canonical proposal enums", () => {
    expect(
      analyticsProposalSchema.safeParse({
        ...validProposal,
        risk: "critical",
        status: "finished",
        decisionReason: "unknown_reason",
      }).success,
    ).toBe(false);
  });

  test("should require null income commitment when monthly income is zero", () => {
    expect(
      analyticsProposalSchema.safeParse({
        ...validProposal,
        monthlyIncome: 0,
        incomeCommitment: null,
      }).success,
    ).toBe(true);

    expect(
      analyticsProposalSchema.safeParse({
        ...validProposal,
        monthlyIncome: 0,
        incomeCommitment: 0,
      }).success,
    ).toBe(false);
  });
});
