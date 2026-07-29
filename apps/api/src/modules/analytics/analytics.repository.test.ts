import type { AnalyticsSummary } from "@credit-decision-hub/contracts";
import { describe, expect, test, vi } from "vitest";

import { createDatabricksAnalyticsRepository } from "./analytics.repository.js";

const config = {
  host: "https://example.cloud.databricks.com",
  token: "local-token",
  warehouseId: "warehouse-id",
};

const columns = [
  "dataset_version",
  "total_proposals",
  "approved_proposals",
  "approval_rate",
  "total_requested_amount",
  "average_requested_amount",
  "average_income_commitment",
].map((name) => ({ name }));

const successfulResponse = {
  statement_id: "statement-id",
  status: { state: "SUCCEEDED" },
  manifest: { schema: { columns } },
  result: {
    data_array: [
      ["1", "1000", "200", "20", "70816365.76", "70816.37", "11.09"],
    ],
  },
};

const summary: AnalyticsSummary = {
  source: "databricks",
  datasetVersion: "1",
  totalProposals: 1_000,
  approvedProposals: 200,
  approvalRate: 20,
  totalRequestedAmount: 70_816_365.76,
  averageRequestedAmount: 70_816.37,
  averageIncomeCommitment: 11.09,
};

describe("Databricks analytics repository", () => {
  test("should execute a read-only statement and map its summary", async () => {
    const request = vi.fn<typeof fetch>(async () =>
      Response.json(successfulResponse),
    );
    const repository = createDatabricksAnalyticsRepository(config, {
      fetch: request,
    });

    await expect(repository.getSummary()).resolves.toEqual(summary);

    const [, init] = request.mock.calls[0]!;
    const body = JSON.parse(String(init?.body)) as {
      statement: string;
      warehouse_id: string;
    };

    expect(body.warehouse_id).toBe(config.warehouseId);
    expect(body.statement).toContain(
      "workspace.credit_decision_hub.analytics_proposal_kpis",
    );
    expect(init?.headers).toMatchObject({
      Authorization: `Bearer ${config.token}`,
    });
  });

  test("should poll an unfinished statement without resubmitting it", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({
          statement_id: "statement-id",
          status: { state: "PENDING" },
        }),
      )
      .mockResolvedValueOnce(Response.json(successfulResponse));
    const wait = vi.fn(async () => Promise.resolve());
    const repository = createDatabricksAnalyticsRepository(config, {
      fetch: request,
      wait,
    });

    await expect(repository.getSummary()).resolves.toEqual(summary);
    expect(wait).toHaveBeenCalledWith(1_000);
    expect(request).toHaveBeenNthCalledWith(
      2,
      `${config.host}/api/2.0/sql/statements/statement-id`,
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });

  test("should reject a failed Databricks statement", async () => {
    const request = vi.fn<typeof fetch>(async () =>
      Response.json({
        statement_id: "statement-id",
        status: { state: "FAILED" },
      }),
    );
    const repository = createDatabricksAnalyticsRepository(config, {
      fetch: request,
    });

    await expect(repository.getSummary()).rejects.toThrow(
      "A consulta analítica falhou no Databricks",
    );
  });
});
