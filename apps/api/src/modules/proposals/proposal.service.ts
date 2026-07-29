import {
  proposalListResponseSchema,
  type CreateProposalInput,
  type Customer,
  type ListProposalsQuery,
  type Proposal,
  type ProposalListResponse,
} from "@credit-decision-hub/contracts";

import {
  ProposalCustomerNotFoundError,
  ProposalNotFoundError,
} from "./proposal.errors.js";
import type {
  ProposalRepository,
  ProposalToCreate,
} from "./proposal.repository.js";
import {
  evaluateProposal,
  proposalDecisionReasonMessages,
} from "./proposal.rules.js";

export type ProposalCustomerReader = {
  findById(id: string): Promise<Pick<Customer, "id" | "monthlyIncome"> | null>;
};

export type ProposalService = {
  create(input: CreateProposalInput): Promise<Proposal>;
  getById(id: string): Promise<Proposal>;
  list(query: ListProposalsQuery): Promise<ProposalListResponse>;
};

type ProposalServiceDependencies = {
  customerReader: ProposalCustomerReader;
  repository: ProposalRepository;
  now?: () => Date;
};

export const createProposalService = ({
  customerReader,
  repository,
  now = () => new Date(),
}: ProposalServiceDependencies): ProposalService => ({
  async create(input) {
    const customer = await customerReader.findById(input.customerId);

    if (!customer) {
      throw new ProposalCustomerNotFoundError();
    }

    const evaluation = evaluateProposal({
      ...input,
      monthlyIncome: customer.monthlyIncome,
    });
    const occurredAt = now().toISOString();
    const proposal: ProposalToCreate = {
      ...input,
      ...evaluation,
      assignedAnalystId: null,
      history: [
        {
          fromStatus: null,
          toStatus: "pending",
          reasonCode: "proposal_created",
          reason: proposalDecisionReasonMessages.proposal_created,
          actorType: "system",
          actorId: null,
          createdAt: occurredAt,
        },
        {
          fromStatus: "pending",
          toStatus: evaluation.status,
          reasonCode: evaluation.decisionReasonCode,
          reason: evaluation.decisionReason,
          actorType: "system",
          actorId: null,
          createdAt: occurredAt,
        },
      ],
    };

    return repository.create(proposal);
  },

  async getById(id) {
    const proposal = await repository.findById(id);

    if (!proposal) {
      throw new ProposalNotFoundError();
    }

    return proposal;
  },

  async list(query) {
    const page = await repository.findPage(query);

    return proposalListResponseSchema.parse({
      data: page.data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: page.total,
        totalPages: Math.ceil(page.total / query.limit),
      },
    });
  },
});
