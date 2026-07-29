import mongoose from "mongoose";
import { describe, expect, test } from "vitest";

import { ProposalModel } from "./proposal.model.js";

const validProposal = {
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
      fromStatus: null,
      toStatus: "pending",
      reasonCode: "proposal_created",
      reason: "Proposta criada",
      actorType: "system",
      actorId: null,
      createdAt: new Date("2026-07-29T17:00:00.000Z"),
    },
    {
      fromStatus: "pending",
      toStatus: "approved",
      reasonCode: "eligible",
      reason: "Critérios automáticos atendidos",
      actorType: "system",
      actorId: null,
      createdAt: new Date("2026-07-29T17:00:01.000Z"),
    },
  ],
};

describe("ProposalModel", () => {
  test("should validate a proposal aligned with the persistence schema", async () => {
    const proposal = new ProposalModel(validProposal);

    await expect(proposal.validate()).resolves.toBeUndefined();
    expect(proposal.history).toHaveLength(2);
    expect(proposal.createdAt).toBeUndefined();
    expect(proposal.updatedAt).toBeUndefined();
  });

  test("should reject values outside persistence constraints", async () => {
    const proposal = new ProposalModel({
      ...validProposal,
      requestedAmount: 0,
      installments: 1.5,
      score: 999.5,
      fraudSignals: ["document_mismatch", "document_mismatch"],
      status: "unknown",
    });
    const validationError: unknown = await proposal
      .validate()
      .catch((error: unknown) => error);

    expect(validationError).toBeInstanceOf(mongoose.Error.ValidationError);
    if (validationError instanceof mongoose.Error.ValidationError) {
      expect(validationError.errors.requestedAmount).toBeDefined();
      expect(validationError.errors.installments).toBeDefined();
      expect(validationError.errors.score).toBeDefined();
      expect(validationError.errors.fraudSignals).toBeDefined();
      expect(validationError.errors.status).toBeDefined();
    }
  });

  test("should require at least one history event", async () => {
    const proposal = new ProposalModel({
      ...validProposal,
      history: [],
    });

    await expect(proposal.validate()).rejects.toMatchObject({
      errors: {
        history: expect.anything(),
      },
    });
  });

  test("should define indexes for supported proposal filters", () => {
    const indexFields = ProposalModel.schema
      .indexes()
      .map(([fields]) => fields);

    expect(indexFields).toEqual(
      expect.arrayContaining([
        { customerId: 1, createdAt: -1 },
        { status: 1, createdAt: -1 },
        { riskLevel: 1, createdAt: -1 },
        { requestedAmount: 1 },
        { seedKey: 1 },
      ]),
    );
  });
});
