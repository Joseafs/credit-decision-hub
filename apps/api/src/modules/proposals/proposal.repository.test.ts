import type { ListProposalsQuery } from "@credit-decision-hub/contracts";
import { describe, expect, test } from "vitest";

import { ProposalModel } from "./proposal.model.js";
import { toProposal, toProposalFilter } from "./proposal.repository.js";

const createdAt = new Date("2026-07-29T17:00:00.000Z");
const updatedAt = new Date("2026-07-29T17:00:01.000Z");

describe("proposal repository mapping", () => {
  test("should convert a Mongoose document to the shared proposal contract", () => {
    const document = ProposalModel.hydrate({
      _id: "507f1f77bcf86cd799439012",
      customerId: "507f1f77bcf86cd799439011",
      requestedAmount: 60_000,
      installments: 24,
      score: 750,
      documentsComplete: true,
      fraudSignals: [],
      estimatedInstallmentAmount: 2_500,
      incomeCommitment: 25,
      riskLevel: "low",
      status: "approved",
      decisionReasonCode: "eligible",
      decisionReason: "Critérios automáticos atendidos",
      assignedAnalystId: null,
      history: [
        {
          _id: "507f1f77bcf86cd799439013",
          fromStatus: null,
          toStatus: "pending",
          reasonCode: "proposal_created",
          reason: "Proposta criada",
          actorType: "system",
          actorId: null,
          createdAt,
        },
        {
          _id: "507f1f77bcf86cd799439014",
          fromStatus: "pending",
          toStatus: "approved",
          reasonCode: "eligible",
          reason: "Critérios automáticos atendidos",
          actorType: "system",
          actorId: null,
          createdAt: updatedAt,
        },
      ],
      createdAt,
      updatedAt,
    });

    const proposal = toProposal(document);

    expect(proposal).toEqual({
      id: "507f1f77bcf86cd799439012",
      customerId: "507f1f77bcf86cd799439011",
      requestedAmount: 60_000,
      installments: 24,
      score: 750,
      documentsComplete: true,
      fraudSignals: [],
      estimatedInstallmentAmount: 2_500,
      incomeCommitment: 25,
      riskLevel: "low",
      status: "approved",
      decisionReasonCode: "eligible",
      decisionReason: "Critérios automáticos atendidos",
      assignedAnalystId: null,
      history: [
        {
          id: "507f1f77bcf86cd799439013",
          fromStatus: null,
          toStatus: "pending",
          reasonCode: "proposal_created",
          reason: "Proposta criada",
          actorType: "system",
          actorId: null,
          createdAt: createdAt.toISOString(),
        },
        {
          id: "507f1f77bcf86cd799439014",
          fromStatus: "pending",
          toStatus: "approved",
          reasonCode: "eligible",
          reason: "Critérios automáticos atendidos",
          actorType: "system",
          actorId: null,
          createdAt: updatedAt.toISOString(),
        },
      ],
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });
    expect(proposal).not.toHaveProperty("_id");
    expect(proposal.history[0]).not.toHaveProperty("_id");
  });

  test("should translate supported query fields to a persistence filter", () => {
    const query: ListProposalsQuery = {
      page: 2,
      limit: 10,
      customerId: "507f1f77bcf86cd799439011",
      status: "manual_review",
      riskLevel: "medium",
      createdFrom: "2026-01-01T00:00:00.000Z",
      createdTo: "2026-12-31T23:59:59.999Z",
      minRequestedAmount: 10_000,
      maxRequestedAmount: 50_000,
    };

    expect(toProposalFilter(query)).toEqual({
      customerId: query.customerId,
      status: "manual_review",
      riskLevel: "medium",
      createdAt: {
        $gte: new Date("2026-01-01T00:00:00.000Z"),
        $lte: new Date("2026-12-31T23:59:59.999Z"),
      },
      requestedAmount: {
        $gte: 10_000,
        $lte: 50_000,
      },
    });
  });

  test("should create an empty persistence filter for pagination only", () => {
    expect(toProposalFilter({ page: 1, limit: 20 })).toEqual({});
  });
});
