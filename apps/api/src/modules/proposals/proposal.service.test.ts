import type {
  CreateProposalInput,
  Proposal,
} from "@credit-decision-hub/contracts";
import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  InvalidProposalTransitionError,
  ProposalCustomerNotFoundError,
  ProposalNotFoundError,
} from "./proposal.errors.js";
import type { ProposalRepository } from "./proposal.repository.js";
import {
  createProposalService,
  type ProposalCustomerReader,
} from "./proposal.service.js";

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

const createRepositoryMock = (): ProposalRepository => ({
  create: vi.fn(async () => proposal),
  findById: vi.fn(async () => proposal),
  findPage: vi.fn(async () => ({
    data: [proposal],
    total: 1,
  })),
  updateDecision: vi.fn(async () => proposal),
});

const createCustomerReaderMock = (): ProposalCustomerReader => ({
  findById: vi.fn(async () => ({
    id: proposalInput.customerId,
    monthlyIncome: 10_000,
  })),
});

describe("proposal service", () => {
  let customerReader: ProposalCustomerReader;
  let repository: ProposalRepository;

  beforeEach(() => {
    customerReader = createCustomerReaderMock();
    repository = createRepositoryMock();
  });

  test("should evaluate and create a proposal with automatic history", async () => {
    const service = createProposalService({
      customerReader,
      repository,
      now: () => new Date(occurredAt),
    });

    await expect(service.create(proposalInput)).resolves.toEqual(proposal);
    expect(customerReader.findById).toHaveBeenCalledWith(
      proposalInput.customerId,
    );
    expect(repository.create).toHaveBeenCalledWith({
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
          fromStatus: null,
          toStatus: "pending",
          reasonCode: "proposal_created",
          reason: "Proposta criada",
          actorType: "system",
          actorId: null,
          createdAt: occurredAt,
        },
        {
          fromStatus: "pending",
          toStatus: "approved",
          reasonCode: "eligible",
          reason: "Critérios automáticos atendidos",
          actorType: "system",
          actorId: null,
          createdAt: occurredAt,
        },
      ],
    });
  });

  test("should reject creation for an unknown customer", async () => {
    vi.mocked(customerReader.findById).mockResolvedValue(null);
    const service = createProposalService({
      customerReader,
      repository,
    });

    await expect(service.create(proposalInput)).rejects.toBeInstanceOf(
      ProposalCustomerNotFoundError,
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  test("should return a proposal by id", async () => {
    const service = createProposalService({
      customerReader,
      repository,
    });

    await expect(service.getById(proposal.id)).resolves.toEqual(proposal);
  });

  test("should reject an unknown proposal", async () => {
    vi.mocked(repository.findById).mockResolvedValue(null);
    const service = createProposalService({
      customerReader,
      repository,
    });

    await expect(service.getById(proposal.id)).rejects.toBeInstanceOf(
      ProposalNotFoundError,
    );
  });

  test("should return a validated paginated proposal list", async () => {
    vi.mocked(repository.findPage).mockResolvedValue({
      data: [proposal],
      total: 45,
    });
    const service = createProposalService({
      customerReader,
      repository,
    });

    await expect(service.list({ page: 2, limit: 20 })).resolves.toEqual({
      data: [proposal],
      pagination: {
        page: 2,
        limit: 20,
        total: 45,
        totalPages: 3,
      },
    });
  });

  test("should record an allowed manual decision with the authenticated actor", async () => {
    const reviewProposal = { ...proposal, status: "manual_review" as const };
    vi.mocked(repository.findById).mockResolvedValue(reviewProposal);
    vi.mocked(repository.updateDecision).mockResolvedValue({
      ...reviewProposal,
      status: "approved",
      decisionReasonCode: "manual_approval",
      decisionReason: "Documentação revisada",
    });
    const service = createProposalService({
      customerReader,
      repository,
      now: () => new Date(occurredAt),
    });

    await service.decide(
      proposal.id,
      { status: "approved", reason: "Documentação revisada" },
      "507f1f77bcf86cd799439099",
    );

    expect(repository.updateDecision).toHaveBeenCalledWith({
      id: proposal.id,
      expectedStatus: "manual_review",
      status: "approved",
      reasonCode: "manual_approval",
      reason: "Documentação revisada",
      actorId: "507f1f77bcf86cd799439099",
      createdAt: occurredAt,
    });
  });

  test("should reject a manual decision from a final status", async () => {
    const service = createProposalService({ customerReader, repository });
    await expect(
      service.decide(
        proposal.id,
        { status: "rejected", reason: "Tentativa inválida" },
        "507f1f77bcf86cd799439099",
      ),
    ).rejects.toBeInstanceOf(InvalidProposalTransitionError);
    expect(repository.updateDecision).not.toHaveBeenCalled();
  });
});
