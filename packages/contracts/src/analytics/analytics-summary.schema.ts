import { z } from "zod";

export const analyticsSummarySchema = z
  .object({
    source: z.literal("databricks"),
    datasetVersion: z.literal("1"),
    totalProposals: z.number().int().nonnegative(),
    approvedProposals: z.number().int().nonnegative(),
    approvalRate: z.number().min(0).max(100),
    totalRequestedAmount: z.number().nonnegative(),
    averageRequestedAmount: z.number().nonnegative(),
    averageIncomeCommitment: z.number().nonnegative().nullable(),
  })
  .strict()
  .refine(
    ({ approvedProposals, totalProposals }) =>
      approvedProposals <= totalProposals,
    {
      message: "Propostas aprovadas não podem superar o total",
      path: ["approvedProposals"],
    },
  );

export type AnalyticsSummary = z.infer<typeof analyticsSummarySchema>;
