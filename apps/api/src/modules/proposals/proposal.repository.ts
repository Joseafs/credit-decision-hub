import {
  proposalSchema,
  type ListProposalsQuery,
  type Proposal,
  type ProposalHistory,
} from "@credit-decision-hub/contracts";
import mongoose, { type HydratedDocument } from "mongoose";

import { ProposalModel, type ProposalPersistence } from "./proposal.model.js";

type SystemProposalHistoryToCreate = Omit<
  Extract<ProposalHistory, { actorType: "system" }>,
  "id"
>;

export type ProposalToCreate = Omit<
  Proposal,
  "id" | "history" | "createdAt" | "updatedAt"
> & {
  history: SystemProposalHistoryToCreate[];
};

type ProposalPage = {
  data: Proposal[];
  total: number;
};

export type ProposalRepository = {
  create(input: ProposalToCreate): Promise<Proposal>;
  findById(id: string): Promise<Proposal | null>;
  findPage(query: ListProposalsQuery): Promise<ProposalPage>;
};

export const toProposal = (
  document: HydratedDocument<ProposalPersistence>,
): Proposal =>
  proposalSchema.parse({
    id: document._id.toString(),
    customerId: document.customerId.toString(),
    requestedAmount: document.requestedAmount,
    installments: document.installments,
    score: document.score,
    documentsComplete: document.documentsComplete,
    fraudSignals: [...document.fraudSignals],
    estimatedInstallmentAmount: document.estimatedInstallmentAmount,
    incomeCommitment: document.incomeCommitment,
    riskLevel: document.riskLevel,
    status: document.status,
    decisionReasonCode: document.decisionReasonCode,
    decisionReason: document.decisionReason,
    assignedAnalystId: document.assignedAnalystId?.toString() ?? null,
    history: document.history.map((event) => ({
      id: event._id.toString(),
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      reasonCode: event.reasonCode,
      reason: event.reason,
      actorType: event.actorType,
      actorId: event.actorId?.toString() ?? null,
      createdAt: event.createdAt.toISOString(),
    })),
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  });

export const toProposalFilter = (
  query: ListProposalsQuery,
): mongoose.QueryFilter<ProposalPersistence> => {
  const filter: mongoose.QueryFilter<ProposalPersistence> = {};

  if (query.customerId !== undefined) {
    filter.customerId = query.customerId;
  }

  if (query.status !== undefined) {
    filter.status = query.status;
  }

  if (query.riskLevel !== undefined) {
    filter.riskLevel = query.riskLevel;
  }

  if (query.createdFrom !== undefined || query.createdTo !== undefined) {
    filter.createdAt = {
      ...(query.createdFrom === undefined
        ? {}
        : { $gte: new Date(query.createdFrom) }),
      ...(query.createdTo === undefined
        ? {}
        : { $lte: new Date(query.createdTo) }),
    };
  }

  if (
    query.minRequestedAmount !== undefined ||
    query.maxRequestedAmount !== undefined
  ) {
    filter.requestedAmount = {
      ...(query.minRequestedAmount === undefined
        ? {}
        : { $gte: query.minRequestedAmount }),
      ...(query.maxRequestedAmount === undefined
        ? {}
        : { $lte: query.maxRequestedAmount }),
    };
  }

  return filter;
};

export const proposalRepository: ProposalRepository = {
  async create(input) {
    const proposal = await ProposalModel.create(input);

    return toProposal(proposal);
  },

  async findById(id) {
    const proposal = await ProposalModel.findById(id).exec();

    return proposal ? toProposal(proposal) : null;
  },

  async findPage(query) {
    const filter = toProposalFilter(query);
    const skip = (query.page - 1) * query.limit;
    const [proposals, total] = await Promise.all([
      ProposalModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .exec(),
      ProposalModel.countDocuments(filter).exec(),
    ]);

    return {
      data: proposals.map(toProposal),
      total,
    };
  },
};
