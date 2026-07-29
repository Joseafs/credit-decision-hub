import { z } from "zod";

import {
  proposalDecisionReasonCodeSchema,
  proposalStatusSchema,
} from "../proposal/proposal-history.schema.js";
import { proposalRiskLevelSchema } from "../proposal/proposal.schema.js";
import { entityIdSchema } from "../shared/entity.schema.js";

export const analyticsProposalExportVersionSchema = z.literal("1");

export const analyticsProposalSchema = z
  .object({
    exportVersion: analyticsProposalExportVersionSchema,
    proposalId: entityIdSchema,
    customerId: entityIdSchema,
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    requestedAmount: z.number().positive(),
    installments: z.number().int().min(1).max(60),
    estimatedInstallment: z.number().positive(),
    monthlyIncome: z.number().nonnegative(),
    occupation: z.string().trim().min(1).max(100),
    score: z.number().int().min(0).max(1000),
    incomeCommitment: z.number().nonnegative().nullable(),
    risk: proposalRiskLevelSchema,
    status: proposalStatusSchema,
    decisionReason: proposalDecisionReasonCodeSchema,
  })
  .strict()
  .superRefine((proposal, context) => {
    if (proposal.monthlyIncome === 0 && proposal.incomeCommitment !== null) {
      context.addIssue({
        code: "custom",
        message:
          "Comprometimento de renda deve ser nulo quando a renda for zero",
        path: ["incomeCommitment"],
      });
    }
  });

export type AnalyticsProposalExportVersion = z.infer<
  typeof analyticsProposalExportVersionSchema
>;
export type AnalyticsProposal = z.infer<typeof analyticsProposalSchema>;
