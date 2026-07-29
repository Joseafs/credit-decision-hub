import { z } from "zod";

import { entityIdSchema } from "../shared/entity.schema.js";
import {
  paginationMetadataSchema,
  paginationQuerySchema,
} from "../shared/pagination.schema.js";
import {
  proposalDecisionReasonCodeSchema,
  proposalHistorySchema,
  proposalStatusSchema,
} from "./proposal-history.schema.js";
import {
  proposalFraudSignalValues,
  proposalRiskLevelValues,
} from "./proposal.values.js";

export const proposalRiskLevelSchema = z.enum(proposalRiskLevelValues);
export const proposalFraudSignalSchema = z.enum(proposalFraudSignalValues);

const fraudSignalsSchema = z
  .array(proposalFraudSignalSchema)
  .max(proposalFraudSignalValues.length)
  .refine(
    (signals) => new Set(signals).size === signals.length,
    "Indícios de fraude não podem ser duplicados",
  );

const proposalCreationFieldsSchema = z.object({
  customerId: entityIdSchema,
  requestedAmount: z.number().positive(),
  installments: z.number().int().min(1).max(60),
  score: z.number().int().min(0).max(1000),
  documentsComplete: z.boolean(),
  fraudSignals: fraudSignalsSchema,
});

export const createProposalSchema = proposalCreationFieldsSchema.strict();

export const proposalSchema = proposalCreationFieldsSchema
  .extend({
    id: entityIdSchema,
    estimatedInstallmentAmount: z.number().positive(),
    incomeCommitment: z.number().nonnegative().nullable(),
    riskLevel: proposalRiskLevelSchema,
    status: proposalStatusSchema,
    decisionReasonCode: proposalDecisionReasonCodeSchema,
    decisionReason: z.string().trim().min(1).max(240),
    assignedAnalystId: entityIdSchema.nullable(),
    history: z.array(proposalHistorySchema).min(1),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict()
  .superRefine((proposal, context) => {
    const firstHistory = proposal.history[0];
    const lastHistory = proposal.history.at(-1);

    if (firstHistory?.reasonCode !== "proposal_created") {
      context.addIssue({
        code: "custom",
        message: "O histórico deve iniciar com a criação da proposta",
        path: ["history", 0],
      });
    }

    if (lastHistory?.toStatus !== proposal.status) {
      context.addIssue({
        code: "custom",
        message: "O status deve corresponder ao último evento do histórico",
        path: ["status"],
      });
    }

    if (lastHistory?.reasonCode !== proposal.decisionReasonCode) {
      context.addIssue({
        code: "custom",
        message: "O motivo deve corresponder ao último evento do histórico",
        path: ["decisionReasonCode"],
      });
    }

    if (lastHistory?.reason !== proposal.decisionReason) {
      context.addIssue({
        code: "custom",
        message: "A descrição deve corresponder ao último evento do histórico",
        path: ["decisionReason"],
      });
    }

    proposal.history.slice(1).forEach((event, index) => {
      const previousEvent = proposal.history[index];

      if (
        previousEvent !== undefined &&
        Date.parse(previousEvent.createdAt) > Date.parse(event.createdAt)
      ) {
        context.addIssue({
          code: "custom",
          message: "O histórico deve estar em ordem cronológica",
          path: ["history", index + 1, "createdAt"],
        });
      }
    });
  });

export const proposalIdParamsSchema = z
  .object({
    id: entityIdSchema,
  })
  .strict();

export const listProposalsQuerySchema = paginationQuerySchema
  .extend({
    customerId: entityIdSchema.optional(),
    status: proposalStatusSchema.optional(),
    riskLevel: proposalRiskLevelSchema.optional(),
    createdFrom: z.iso.datetime().optional(),
    createdTo: z.iso.datetime().optional(),
    minRequestedAmount: z.coerce.number().nonnegative().optional(),
    maxRequestedAmount: z.coerce.number().nonnegative().optional(),
  })
  .strict()
  .superRefine((query, context) => {
    if (
      query.minRequestedAmount !== undefined &&
      query.maxRequestedAmount !== undefined &&
      query.minRequestedAmount > query.maxRequestedAmount
    ) {
      context.addIssue({
        code: "custom",
        message: "O valor mínimo não pode ser maior que o valor máximo",
        path: ["minRequestedAmount"],
      });
    }

    if (
      query.createdFrom !== undefined &&
      query.createdTo !== undefined &&
      Date.parse(query.createdFrom) > Date.parse(query.createdTo)
    ) {
      context.addIssue({
        code: "custom",
        message: "A data inicial não pode ser posterior à data final",
        path: ["createdFrom"],
      });
    }
  });

export const proposalListResponseSchema = z
  .object({
    data: z.array(proposalSchema),
    pagination: paginationMetadataSchema,
  })
  .strict();

export type ProposalRiskLevel = z.infer<typeof proposalRiskLevelSchema>;
export type ProposalFraudSignal = z.infer<typeof proposalFraudSignalSchema>;
export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type Proposal = z.infer<typeof proposalSchema>;
export type ProposalIdParams = z.infer<typeof proposalIdParamsSchema>;
export type ListProposalsQuery = z.infer<typeof listProposalsQuerySchema>;
export type ProposalListResponse = z.infer<typeof proposalListResponseSchema>;
