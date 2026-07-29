import {
  proposalListResponseSchema,
  type CreateProposalInput,
  type Customer,
  type ListProposalsQuery,
  type ManualProposalDecisionInput,
  type Proposal,
  type ProposalListResponse,
} from "@credit-decision-hub/contracts";

import {
  InvalidProposalTransitionError,
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
  decide(
    id: string,
    input: ManualProposalDecisionInput,
    actorId: string,
  ): Promise<Proposal>;
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

  async decide(id, input, actorId) {
    const proposal = await repository.findById(id);
    if (!proposal) throw new ProposalNotFoundError();

    const allowedTransitions: Partial<
      Record<Proposal["status"], Proposal["status"][]>
    > = {
      manual_review: ["approved", "rejected"],
      fraud_suspected: ["manual_review", "rejected"],
    };
    if (!allowedTransitions[proposal.status]?.includes(input.status)) {
      throw new InvalidProposalTransitionError();
    }

    const reasonCodes = {
      approved: "manual_approval",
      rejected: "manual_rejection",
      manual_review: "manual_review_requested",
    } as const;
    const updated = await repository.updateDecision({
      id,
      expectedStatus: proposal.status,
      status: input.status,
      reasonCode: reasonCodes[input.status],
      reason: input.reason,
      actorId,
      createdAt: now().toISOString(),
    });
    if (!updated) throw new InvalidProposalTransitionError();
    return updated;
  },
});
