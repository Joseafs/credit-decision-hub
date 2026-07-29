import { z } from "zod";

import {
  proposalDecisionReasonCodeSchema,
  proposalStatusSchema,
} from "../proposal/proposal-history.schema.js";
import { proposalRiskLevelSchema } from "../proposal/proposal.schema.js";
import {
  proposalRiskLevelValues,
  proposalStatusValues,
} from "../proposal/proposal.values.js";
import { entityIdSchema } from "../shared/entity.schema.js";
import {
  paginationMetadataSchema,
  paginationQuerySchema,
} from "../shared/pagination.schema.js";

const statusMetricSchema = z
  .object({
    status: proposalStatusSchema,
    count: z.number().int().nonnegative(),
  })
  .strict();

const riskMetricSchema = z
  .object({
    riskLevel: proposalRiskLevelSchema,
    count: z.number().int().nonnegative(),
  })
  .strict();

export const dashboardSummarySchema = z
  .object({
    totalProposals: z.number().int().nonnegative(),
    totalRequestedAmount: z.number().nonnegative(),
    approvalRate: z.number().min(0).max(100),
    pendingActionCount: z.number().int().nonnegative(),
    manualDecisionCount: z.number().int().nonnegative(),
    myDecisionCount: z.number().int().nonnegative(),
    statusDistribution: z
      .array(statusMetricSchema)
      .length(proposalStatusValues.length)
      .refine(
        (metrics) =>
          new Set(metrics.map(({ status }) => status)).size ===
          proposalStatusValues.length,
        "A distribuição deve conter cada status uma única vez",
      ),
    riskDistribution: z
      .array(riskMetricSchema)
      .length(proposalRiskLevelValues.length)
      .refine(
        (metrics) =>
          new Set(metrics.map(({ riskLevel }) => riskLevel)).size ===
          proposalRiskLevelValues.length,
        "A distribuição deve conter cada risco uma única vez",
      ),
  })
  .strict();

export const auditEventSchema = z
  .object({
    id: entityIdSchema,
    proposalId: entityIdSchema,
    actorId: entityIdSchema,
    actorName: z.string().trim().min(1).max(120).nullable(),
    fromStatus: proposalStatusSchema,
    toStatus: proposalStatusSchema,
    reasonCode: proposalDecisionReasonCodeSchema,
    reason: z.string().trim().min(1).max(240),
    createdAt: z.iso.datetime(),
  })
  .strict();

export const listAuditEventsQuerySchema = paginationQuerySchema.strict();

export const auditEventListResponseSchema = z
  .object({
    data: z.array(auditEventSchema),
    pagination: paginationMetadataSchema,
  })
  .strict();

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
export type AuditEvent = z.infer<typeof auditEventSchema>;
export type ListAuditEventsQuery = z.infer<typeof listAuditEventsQuerySchema>;
export type AuditEventListResponse = z.infer<
  typeof auditEventListResponseSchema
>;
