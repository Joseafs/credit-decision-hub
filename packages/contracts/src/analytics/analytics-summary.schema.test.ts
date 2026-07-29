import { describe, expect, test } from "vitest";

import { analyticsSummarySchema } from "./analytics-summary.schema.js";

const summary = {
  source: "databricks",
  datasetVersion: "1",
  totalProposals: 1_000,
  approvedProposals: 200,
  approvalRate: 20,
  totalRequestedAmount: 70_816_365.76,
  averageRequestedAmount: 70_816.37,
  averageIncomeCommitment: 11.09,
} as const;

describe("analytics summary contract", () => {
  test("should accept the Databricks analytical summary", () => {
    expect(analyticsSummarySchema.parse(summary)).toEqual(summary);
  });

  test("should reject inconsistent totals and unknown properties", () => {
    expect(
      analyticsSummarySchema.safeParse({
        ...summary,
        approvedProposals: 1_001,
        token: "forbidden",
      }).success,
    ).toBe(false);
  });
});
