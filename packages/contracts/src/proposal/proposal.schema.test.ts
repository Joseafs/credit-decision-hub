import { describe, expect, test } from "vitest";

import {
  proposalHistorySchema,
  type ProposalHistory,
} from "./proposal-history.schema.js";
import {
  createProposalSchema,
  listProposalsQuerySchema,
  proposalListResponseSchema,
  proposalSchema,
  type CreateProposalInput,
} from "./proposal.schema.js";

const customerId = "507f1f77bcf86cd799439011";
const proposalId = "507f1f77bcf86cd799439012";
const historyId = "507f1f77bcf86cd799439013";
const createdAt = "2026-07-29T17:00:00.000Z";

const proposalInput: CreateProposalInput = {
  customerId,
  requestedAmount: 60_000,
  installments: 24,
  score: 750,
  documentsComplete: true,
  fraudSignals: [],
};

const creationHistory: ProposalHistory = {
  id: historyId,
  fromStatus: null,
  toStatus: "pending",
  reasonCode: "proposal_created",
  reason: "Proposta criada",
  actorType: "system",
  actorId: null,
  createdAt,
};

const decisionHistory: ProposalHistory = {
  id: "507f1f77bcf86cd799439014",
  fromStatus: "pending",
  toStatus: "approved",
  reasonCode: "eligible",
  reason: "Critérios automáticos atendidos",
  actorType: "system",
  actorId: null,
  createdAt: "2026-07-29T17:00:01.000Z",
};

const proposalResponse = {
  id: proposalId,
  ...proposalInput,
  estimatedInstallmentAmount: 2_500,
  incomeCommitment: 25,
  riskLevel: "low",
  status: "approved",
  decisionReasonCode: "eligible",
  decisionReason: "Critérios automáticos atendidos",
  assignedAnalystId: null,
  history: [creationHistory, decisionHistory],
  createdAt,
  updatedAt: "2026-07-29T17:00:01.000Z",
};

describe("proposal contracts", () => {
  test("should accept a creation input without calculated fields", () => {
    expect(createProposalSchema.parse(proposalInput)).toEqual(proposalInput);
  });

  test("should reject calculated fields in a creation input", () => {
    const result = createProposalSchema.safeParse({
      ...proposalInput,
      status: "approved",
      riskLevel: "low",
      incomeCommitment: 25,
    });

    expect(result.success).toBe(false);
  });

  test("should accept score and installment boundary values", () => {
    expect(
      createProposalSchema.safeParse({
        ...proposalInput,
        installments: 1,
        score: 0,
      }).success,
    ).toBe(true);
    expect(
      createProposalSchema.safeParse({
        ...proposalInput,
        installments: 60,
        score: 1000,
      }).success,
    ).toBe(true);
  });

  test("should reject invalid proposal values and duplicated fraud signals", () => {
    const invalidInputs = [
      { ...proposalInput, requestedAmount: 0 },
      { ...proposalInput, installments: 61 },
      { ...proposalInput, score: 1001 },
      {
        ...proposalInput,
        fraudSignals: ["document_mismatch", "document_mismatch"],
      },
    ];

    invalidInputs.forEach((input) => {
      expect(createProposalSchema.safeParse(input).success).toBe(false);
    });
  });

  test("should require an analyst id for analyst history", () => {
    const result = proposalHistorySchema.safeParse({
      ...creationHistory,
      fromStatus: "manual_review",
      toStatus: "approved",
      reasonCode: "eligible",
      actorType: "analyst",
      actorId: null,
    });

    expect(result.success).toBe(false);
  });

  test("should enforce creation history semantics", () => {
    const result = proposalHistorySchema.safeParse({
      ...creationHistory,
      fromStatus: "pending",
    });

    expect(result.success).toBe(false);
  });

  test("should validate a complete proposal response", () => {
    const result = proposalSchema.safeParse(proposalResponse);

    expect(result.success).toBe(true);
  });

  test("should reject a response inconsistent with its latest history", () => {
    const result = proposalSchema.safeParse({
      ...proposalResponse,
      status: "rejected",
      decisionReason: "Descrição divergente",
    });

    expect(result.success).toBe(false);
  });

  test("should validate a paginated proposal response", () => {
    const result = proposalListResponseSchema.safeParse({
      data: [proposalResponse],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    });

    expect(result.success).toBe(true);
  });

  test("should parse pagination and proposal filters from query strings", () => {
    expect(
      listProposalsQuerySchema.parse({
        page: "2",
        limit: "10",
        status: "manual_review",
        riskLevel: "medium",
        minRequestedAmount: "10000",
        maxRequestedAmount: "50000",
        createdFrom: "2026-01-01T00:00:00.000Z",
        createdTo: "2026-12-31T23:59:59.999Z",
      }),
    ).toEqual({
      page: 2,
      limit: 10,
      status: "manual_review",
      riskLevel: "medium",
      minRequestedAmount: 10_000,
      maxRequestedAmount: 50_000,
      createdFrom: "2026-01-01T00:00:00.000Z",
      createdTo: "2026-12-31T23:59:59.999Z",
    });
  });

  test("should reject inverted amount and date filters", () => {
    const result = listProposalsQuerySchema.safeParse({
      minRequestedAmount: "50000",
      maxRequestedAmount: "10000",
      createdFrom: "2026-12-31T23:59:59.999Z",
      createdTo: "2026-01-01T00:00:00.000Z",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ["minRequestedAmount"] }),
          expect.objectContaining({ path: ["createdFrom"] }),
        ]),
      );
    }
  });
});
