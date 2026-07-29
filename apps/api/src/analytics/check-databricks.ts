import { loadEnvironmentFiles, readEnvironment } from "../config/env.js";
import { createDatabricksAnalyticsRepository } from "../modules/analytics/analytics.repository.js";

const checkDatabricks = async (): Promise<void> => {
  loadEnvironmentFiles();
  const environment = readEnvironment();

  if (!environment.databricks) {
    throw new Error(
      "Configure DATABRICKS_HOST, DATABRICKS_WAREHOUSE_ID e DATABRICKS_TOKEN",
    );
  }

  const summary = await createDatabricksAnalyticsRepository(
    environment.databricks,
  ).getSummary();

  console.info(
    [
      "Consulta analítica concluída.",
      `Dataset: v${summary.datasetVersion}`,
      `Propostas: ${summary.totalProposals}`,
      `Aprovadas: ${summary.approvedProposals}`,
      `Taxa de aprovação: ${summary.approvalRate}%`,
      `Valor total solicitado: ${summary.totalRequestedAmount}`,
      `Valor médio solicitado: ${summary.averageRequestedAmount}`,
      `Comprometimento médio: ${summary.averageIncomeCommitment ?? "n/d"}%`,
    ].join("\n"),
  );
};

void checkDatabricks().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
