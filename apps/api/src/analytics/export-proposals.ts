import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { loadEnvironmentFiles, readEnvironment } from "../config/env.js";
import {
  connectToDatabase,
  disconnectFromDatabase,
} from "../database/mongodb.js";
import { createMongoAnalyticsProposalSource } from "./analytics-proposal.source.js";
import { exportAnalyticsProposals } from "./proposal-export.js";

const workspaceRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const defaultOutputPath = resolve(
  workspaceRoot,
  "artifacts/analytics/proposals.ndjson",
);

export const readAnalyticsExportPath = (
  args: string[] = process.argv.slice(2),
  source: NodeJS.ProcessEnv = process.env,
): string => {
  const configuredPath =
    args.find((argument) => argument !== "--") ??
    source.ANALYTICS_EXPORT_PATH ??
    defaultOutputPath;

  return resolve(workspaceRoot, configuredPath);
};

const runExport = async (): Promise<void> => {
  loadEnvironmentFiles([
    resolve(workspaceRoot, ".env"),
    resolve(workspaceRoot, ".env.local"),
    ".env",
    ".env.local",
  ]);

  const environment = readEnvironment();
  const outputPath = readAnalyticsExportPath();

  try {
    await connectToDatabase({
      databaseName: environment.mongodbDatabase,
      dnsServers: environment.dnsServers,
      uri: environment.mongodbUri,
    });

    const result = await exportAnalyticsProposals({
      outputPath,
      source: createMongoAnalyticsProposalSource(),
    });

    console.info(
      [
        "Exportação analítica concluída.",
        `Registros: ${result.recordCount}`,
        `Arquivo: ${result.outputPath}`,
      ].join("\n"),
    );
  } finally {
    await disconnectFromDatabase();
  }
};

void runExport().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
