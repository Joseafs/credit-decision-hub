import {
  proposalListResponseSchema,
  proposalSchema,
  type CreateProposalInput,
  type Proposal,
} from "@credit-decision-hub/contracts";
import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";

import { buildApp } from "../../app.js";
import {
  ProposalCustomerNotFoundError,
  ProposalNotFoundError,
} from "./proposal.errors.js";
import type { ProposalService } from "./proposal.service.js";

const occurredAt = "2026-07-29T17:00:00.000Z";

const proposalInput: CreateProposalInput = {
  customerId: "507f1f77bcf86cd799439011",
  requestedAmount: 60_000,
  installments: 24,
  score: 750,
  documentsComplete: true,
  fraudSignals: [],
};

const proposal: Proposal = {
  id: "507f1f77bcf86cd799439012",
  ...proposalInput,
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
      createdAt: occurredAt,
    },
    {
      id: "507f1f77bcf86cd799439014",
      fromStatus: "pending",
      toStatus: "approved",
      reasonCode: "eligible",
      reason: "Critérios automáticos atendidos",
      actorType: "system",
      actorId: null,
      createdAt: occurredAt,
    },
  ],
  createdAt: occurredAt,
  updatedAt: occurredAt,
};

const proposalService: ProposalService = {
  create: vi.fn(async () => proposal),
  getById: vi.fn(async () => proposal),
  list: vi.fn(async ({ page, limit }) => ({
    data: [proposal],
    pagination: {
      page,
      limit,
      total: 1,
      totalPages: 1,
    },
  })),
};

const app = buildApp({ proposalService });

afterAll(async () => {
  await app.close();
});

describe("proposal routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should create and return an automatically evaluated proposal", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/proposals",
      payload: proposalInput,
    });

    expect(response.statusCode).toBe(201);
    expect(proposalSchema.parse(response.json())).toEqual(proposal);
    expect(proposalService.create).toHaveBeenCalledWith(proposalInput);
  });

  test("should reject calculated fields in the creation payload", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/proposals",
      payload: {
        ...proposalInput,
        status: "approved",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      message: "Dados inválidos",
      issues: [
        {
          path: "",
          message: expect.any(String),
        },
      ],
    });
    expect(proposalService.create).not.toHaveBeenCalled();
  });

  test("should return not found when the proposal customer does not exist", async () => {
    vi.mocked(proposalService.create).mockRejectedValueOnce(
      new ProposalCustomerNotFoundError(),
    );

    const response = await app.inject({
      method: "POST",
      url: "/proposals",
      payload: proposalInput,
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      message: "Cliente não encontrado",
    });
  });

  test("should list proposals with parsed filters and pagination", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/proposals?page=2&limit=10&customerId=${proposal.customerId}&status=approved&riskLevel=low&minRequestedAmount=10000&maxRequestedAmount=70000`,
    });

    expect(response.statusCode).toBe(200);
    expect(proposalListResponseSchema.parse(response.json())).toEqual({
      data: [proposal],
      pagination: {
        page: 2,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    });
    expect(proposalService.list).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      customerId: proposal.customerId,
      status: "approved",
      riskLevel: "low",
      minRequestedAmount: 10_000,
      maxRequestedAmount: 70_000,
    });
  });

  test("should reject inverted proposal filters", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/proposals?minRequestedAmount=70000&maxRequestedAmount=10000",
    });

    expect(response.statusCode).toBe(400);
    expect(proposalService.list).not.toHaveBeenCalled();
  });

  test("should return a proposal by id", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/proposals/${proposal.id}`,
    });

    expect(response.statusCode).toBe(200);
    expect(proposalSchema.parse(response.json())).toEqual(proposal);
    expect(proposalService.getById).toHaveBeenCalledWith(proposal.id);
  });

  test("should return not found for an unknown proposal", async () => {
    vi.mocked(proposalService.getById).mockRejectedValueOnce(
      new ProposalNotFoundError(),
    );

    const response = await app.inject({
      method: "GET",
      url: `/proposals/${proposal.id}`,
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      message: "Proposta não encontrada",
    });
  });

  test("should reject an invalid proposal id", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/proposals/invalid-id",
    });

    expect(response.statusCode).toBe(400);
    expect(proposalService.getById).not.toHaveBeenCalled();
  });
});
