import {
  analyticsProposalSchema,
  type AnalyticsProposal,
} from "@credit-decision-hub/contracts";
import {
  createWriteStream,
  promises as fileSystemPromises,
  type WriteStream,
} from "node:fs";
import { dirname } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import {
  type AnalyticsProposalSource,
  type AnalyticsProposalSourceRecord,
} from "./analytics-proposal.source.js";

type AnalyticsExportFileSystem = {
  createWriteStream: (path: string) => NodeJS.WritableStream;
  makeDirectory: (path: string) => Promise<void>;
  removeFile: (path: string) => Promise<void>;
  renameFile: (source: string, destination: string) => Promise<void>;
};

export type ExportAnalyticsProposalsOptions = {
  fileSystem?: AnalyticsExportFileSystem;
  outputPath: string;
  source: AnalyticsProposalSource;
};

export type AnalyticsProposalExportResult = {
  outputPath: string;
  recordCount: number;
};

const nodeFileSystem: AnalyticsExportFileSystem = {
  createWriteStream: (path): WriteStream =>
    createWriteStream(path, { encoding: "utf8" }),
  makeDirectory: async (path) => {
    await fileSystemPromises.mkdir(path, { recursive: true });
  },
  removeFile: async (path) => {
    await fileSystemPromises.rm(path, { force: true });
  },
  renameFile: async (source, destination) => {
    await fileSystemPromises.rename(source, destination);
  },
};

const mapAnalyticsProposal = (
  record: AnalyticsProposalSourceRecord,
): AnalyticsProposal =>
  analyticsProposalSchema.parse({
    exportVersion: "1",
    proposalId: record.proposalId.toHexString(),
    customerId: record.customerId.toHexString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    requestedAmount: record.requestedAmount,
    installments: record.installments,
    estimatedInstallment: record.estimatedInstallmentAmount,
    monthlyIncome: record.monthlyIncome,
    occupation: record.occupation,
    score: record.score,
    incomeCommitment: record.incomeCommitment,
    risk: record.riskLevel,
    status: record.status,
    decisionReason: record.decisionReasonCode,
  });

const createNdjsonStream = (
  records: AsyncIterable<AnalyticsProposalSourceRecord>,
  onRecord: () => void,
): Readable =>
  Readable.from(
    (async function* () {
      for await (const record of records) {
        const proposal = mapAnalyticsProposal(record);

        onRecord();
        yield `${JSON.stringify(proposal)}\n`;
      }
    })(),
  );

const removePartialFile = async (
  fileSystem: AnalyticsExportFileSystem,
  partialPath: string,
): Promise<void> => {
  try {
    await fileSystem.removeFile(partialPath);
  } catch {
    // O erro original da exportação é mais relevante que a limpeza auxiliar.
  }
};

export const exportAnalyticsProposals = async ({
  fileSystem = nodeFileSystem,
  outputPath,
  source,
}: ExportAnalyticsProposalsOptions): Promise<AnalyticsProposalExportResult> => {
  const partialPath = `${outputPath}.partial`;
  let recordCount = 0;

  await fileSystem.makeDirectory(dirname(outputPath));
  await removePartialFile(fileSystem, partialPath);

  const cursor = await source.open();
  let cursorClosed = false;

  try {
    await pipeline(
      createNdjsonStream(cursor, () => {
        recordCount += 1;
      }),
      fileSystem.createWriteStream(partialPath),
    );

    await cursor.close();
    cursorClosed = true;
    await fileSystem.renameFile(partialPath, outputPath);

    return {
      outputPath,
      recordCount,
    };
  } catch (error) {
    await removePartialFile(fileSystem, partialPath);
    throw error;
  } finally {
    if (!cursorClosed) {
      try {
        await cursor.close();
      } catch {
        // Mantém o erro que causou a interrupção da exportação.
      }
    }
  }
};
