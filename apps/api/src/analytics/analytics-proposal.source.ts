import type { AnalyticsProposal } from "@credit-decision-hub/contracts";
import type { PipelineStage } from "mongoose";
import { Types } from "mongoose";

import { ProposalModel } from "../modules/proposals/proposal.model.js";

export const ANALYTICS_EXPORT_BATCH_SIZE = 100;

export type AnalyticsProposalSourceRecord = {
  proposalId: Types.ObjectId;
  customerId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  requestedAmount: number;
  installments: number;
  estimatedInstallmentAmount: number;
  monthlyIncome: number;
  occupation: string;
  score: number;
  incomeCommitment: number | null;
  riskLevel: AnalyticsProposal["risk"];
  status: AnalyticsProposal["status"];
  decisionReasonCode: AnalyticsProposal["decisionReason"];
};

export type AnalyticsProposalCursor =
  AsyncIterable<AnalyticsProposalSourceRecord> & {
    close: () => Promise<void>;
  };

export type AnalyticsProposalSource = {
  open: () => Promise<AnalyticsProposalCursor>;
};

export const analyticsProposalPipeline: PipelineStage[] = [
  {
    $sort: {
      _id: 1,
    },
  },
  {
    $lookup: {
      from: "customers",
      localField: "customerId",
      foreignField: "_id",
      as: "customer",
    },
  },
  {
    $unwind: {
      path: "$customer",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $project: {
      _id: 0,
      proposalId: "$_id",
      customerId: 1,
      createdAt: 1,
      updatedAt: 1,
      requestedAmount: 1,
      installments: 1,
      estimatedInstallmentAmount: 1,
      monthlyIncome: "$customer.monthlyIncome",
      occupation: "$customer.occupation",
      score: 1,
      incomeCommitment: 1,
      riskLevel: 1,
      status: 1,
      decisionReasonCode: 1,
    },
  },
];

export const createMongoAnalyticsProposalSource =
  (): AnalyticsProposalSource => ({
    open: async () =>
      ProposalModel.aggregate<AnalyticsProposalSourceRecord>(
        analyticsProposalPipeline,
      ).cursor({ batchSize: ANALYTICS_EXPORT_BATCH_SIZE }),
  });
