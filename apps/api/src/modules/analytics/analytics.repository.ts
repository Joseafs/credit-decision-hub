import {
  analyticsSummarySchema,
  type AnalyticsSummary,
} from "@credit-decision-hub/contracts";
import { z } from "zod";

export type DatabricksConfig = {
  host: string;
  token: string;
  warehouseId: string;
};

export type AnalyticsRepository = {
  getSummary(): Promise<AnalyticsSummary>;
};

type AnalyticsRepositoryDependencies = {
  fetch?: typeof fetch;
  wait?: (milliseconds: number) => Promise<void>;
};

const terminalStateSchema = z.enum([
  "SUCCEEDED",
  "FAILED",
  "CANCELED",
  "CLOSED",
]);

const statementResponseSchema = z
  .object({
    statement_id: z.string().min(1),
    status: z
      .object({
        state: z.string().min(1),
      })
      .passthrough(),
    manifest: z
      .object({
        schema: z.object({
          columns: z.array(
            z
              .object({
                name: z.string(),
              })
              .passthrough(),
          ),
        }),
      })
      .passthrough()
      .optional(),
    result: z
      .object({
        data_array: z.array(z.array(z.string().nullable())),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

type StatementResponse = z.infer<typeof statementResponseSchema>;

const expectedColumns = [
  "dataset_version",
  "total_proposals",
  "approved_proposals",
  "approval_rate",
  "total_requested_amount",
  "average_requested_amount",
  "average_income_commitment",
] as const;

const summaryStatement = `
  SELECT
    '1' AS dataset_version,
    total_proposals,
    approved_proposals,
    approval_rate,
    total_requested_amount,
    average_requested_amount,
    average_income_commitment
  FROM workspace.credit_decision_hub.analytics_proposal_kpis
  LIMIT 1
`;

const defaultWait = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const parseRequiredNumber = (
  value: string | null | undefined,
  field: string,
): number => {
  const parsed = Number(value);

  if (value === null || value === undefined || !Number.isFinite(parsed)) {
    throw new Error(`Valor analítico inválido: ${field}`);
  }

  return parsed;
};

const parseNullableNumber = (
  value: string | null | undefined,
  field: string,
): number | null => (value === null ? null : parseRequiredNumber(value, field));

const toAnalyticsSummary = (response: StatementResponse): AnalyticsSummary => {
  const columns =
    response.manifest?.schema.columns.map(({ name }) => name) ?? [];

  if (
    columns.length !== expectedColumns.length ||
    columns.some((column, index) => column !== expectedColumns[index])
  ) {
    throw new Error("Schema analítico inesperado no Databricks");
  }

  const rows = response.result?.data_array ?? [];

  if (rows.length !== 1) {
    throw new Error("O Databricks deve retornar exatamente um resumo");
  }

  const row = rows[0]!;

  return analyticsSummarySchema.parse({
    source: "databricks",
    datasetVersion: row[0],
    totalProposals: parseRequiredNumber(row[1], "total_proposals"),
    approvedProposals: parseRequiredNumber(row[2], "approved_proposals"),
    approvalRate: parseRequiredNumber(row[3], "approval_rate"),
    totalRequestedAmount: parseRequiredNumber(row[4], "total_requested_amount"),
    averageRequestedAmount: parseRequiredNumber(
      row[5],
      "average_requested_amount",
    ),
    averageIncomeCommitment: parseNullableNumber(
      row[6],
      "average_income_commitment",
    ),
  });
};

export const createDatabricksAnalyticsRepository = (
  config: DatabricksConfig,
  {
    fetch: request = fetch,
    wait = defaultWait,
  }: AnalyticsRepositoryDependencies = {},
): AnalyticsRepository => {
  const requestStatement = async (
    path: string,
    init?: RequestInit,
  ): Promise<StatementResponse> => {
    const response = await request(`${config.host}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Databricks respondeu com HTTP ${response.status}`);
    }

    return statementResponseSchema.parse(await response.json());
  };

  const awaitCompletion = async (
    initialResponse: StatementResponse,
  ): Promise<StatementResponse> => {
    let currentResponse = initialResponse;

    for (let attempt = 0; attempt < 30; attempt += 1) {
      if (terminalStateSchema.safeParse(currentResponse.status.state).success) {
        return currentResponse;
      }

      await wait(1_000);
      currentResponse = await requestStatement(
        `/api/2.0/sql/statements/${currentResponse.statement_id}`,
      );
    }

    throw new Error("Tempo limite excedido ao consultar o Databricks");
  };

  return {
    async getSummary() {
      const initialResponse = await requestStatement(
        "/api/2.0/sql/statements",
        {
          method: "POST",
          body: JSON.stringify({
            statement: summaryStatement,
            warehouse_id: config.warehouseId,
            wait_timeout: "50s",
            on_wait_timeout: "CONTINUE",
            disposition: "INLINE",
            format: "JSON_ARRAY",
          }),
        },
      );
      const completedResponse = await awaitCompletion(initialResponse);

      if (completedResponse.status.state !== "SUCCEEDED") {
        throw new Error("A consulta analítica falhou no Databricks");
      }

      return toAnalyticsSummary(completedResponse);
    },
  };
};
