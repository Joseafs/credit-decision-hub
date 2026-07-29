import type { CreateProposalInput } from "@credit-decision-hub/contracts";
import { describe, expect, test } from "vitest";

import {
  calculateEstimatedInstallment,
  calculateIncomeCommitment,
  classifyProposalRisk,
  evaluateProposal,
} from "./proposal.rules.js";

const proposalInput: CreateProposalInput = {
  customerId: "507f1f77bcf86cd799439011",
  requestedAmount: 60_000,
  installments: 24,
  score: 750,
  documentsComplete: true,
  fraudSignals: [],
};

describe("proposal rules", () => {
  test("should round the estimated installment and income commitment", () => {
    const installment = calculateEstimatedInstallment(1_000, 3);

    expect(installment).toBe(333.33);
    expect(calculateIncomeCommitment(installment, 1_000)).toBe(33.33);
  });

  test("should return unavailable commitment for zero income", () => {
    expect(calculateIncomeCommitment(1_000, 0)).toBeNull();
  });

  test.each([
    { score: 700, commitment: 30, expected: "low" },
    { score: 699, commitment: 30, expected: "medium" },
    { score: 500, commitment: 40, expected: "medium" },
    { score: 499, commitment: 30, expected: "high" },
    { score: 700, commitment: 30.01, expected: "medium" },
    { score: 700, commitment: 40.01, expected: "high" },
    { score: 1000, commitment: null, expected: "high" },
  ] as const)(
    "should classify score $score and commitment $commitment as $expected risk",
    ({ commitment, expected, score }) => {
      expect(classifyProposalRisk(score, commitment)).toBe(expected);
    },
  );

  test("should prioritize fraud over every other condition", () => {
    const evaluation = evaluateProposal({
      ...proposalInput,
      score: 100,
      documentsComplete: false,
      fraudSignals: ["identity_mismatch"],
      monthlyIncome: 0,
    });

    expect(evaluation).toMatchObject({
      status: "fraud_suspected",
      decisionReasonCode: "fraud_signal_detected",
    });
  });

  test("should prioritize incomplete documents over risk rejection", () => {
    const evaluation = evaluateProposal({
      ...proposalInput,
      score: 100,
      documentsComplete: false,
      monthlyIncome: 1_000,
    });

    expect(evaluation).toMatchObject({
      status: "pending_documents",
      decisionReasonCode: "documents_incomplete",
    });
  });

  test("should reject unavailable income before the general risk reason", () => {
    const evaluation = evaluateProposal({
      ...proposalInput,
      monthlyIncome: 0,
    });

    expect(evaluation).toMatchObject({
      incomeCommitment: null,
      riskLevel: "high",
      status: "rejected",
      decisionReasonCode: "income_unavailable",
    });
  });

  test("should reject a high risk proposal", () => {
    const evaluation = evaluateProposal({
      ...proposalInput,
      score: 499,
      monthlyIncome: 10_000,
    });

    expect(evaluation).toMatchObject({
      riskLevel: "high",
      status: "rejected",
      decisionReasonCode: "high_risk",
    });
  });

  test("should send an amount above the limit to manual review", () => {
    const evaluation = evaluateProposal({
      ...proposalInput,
      requestedAmount: 100_000.01,
      installments: 60,
      monthlyIncome: 10_000,
    });

    expect(evaluation).toMatchObject({
      riskLevel: "low",
      status: "manual_review",
      decisionReasonCode: "high_amount",
    });
  });

  test("should send medium risk to manual review", () => {
    const evaluation = evaluateProposal({
      ...proposalInput,
      score: 699,
      monthlyIncome: 10_000,
    });

    expect(evaluation).toMatchObject({
      riskLevel: "medium",
      status: "manual_review",
      decisionReasonCode: "medium_risk",
    });
  });

  test("should approve the exact amount and low risk boundaries", () => {
    const evaluation = evaluateProposal({
      ...proposalInput,
      requestedAmount: 100_000,
      installments: 10,
      score: 700,
      monthlyIncome: 33_333.33,
    });

    expect(evaluation).toEqual({
      estimatedInstallmentAmount: 10_000,
      incomeCommitment: 30,
      riskLevel: "low",
      status: "approved",
      decisionReasonCode: "eligible",
      decisionReason: "Critérios automáticos atendidos",
    });
  });
});
