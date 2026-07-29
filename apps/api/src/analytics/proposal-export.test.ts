import { analyticsProposalSchema } from "@credit-decision-hub/contracts";
import { promises as fileSystem } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Writable } from "node:stream";
import { Types } from "mongoose";
import { afterEach, describe, expect, test, vi } from "vitest";

import {
  analyticsProposalPipeline,
  type AnalyticsProposalCursor,
  type AnalyticsProposalSource,
  type AnalyticsProposalSourceRecord,
} from "./analytics-proposal.source.js";
import { exportAnalyticsProposals } from "./proposal-export.js";

const temporaryDirectories: string[] = [];

const validRecord: AnalyticsProposalSourceRecord = {
  proposalId: new Types.ObjectId("507f1f77bcf86cd799439011"),
  customerId: new Types.ObjectId("507f1f77bcf86cd799439012"),
  createdAt: new Date("2026-07-29T17:00:00.000Z"),
  updatedAt: new Date("2026-07-29T17:00:01.000Z"),
  requestedAmount: 60_000,
  installments: 24,
  estimatedInstallmentAmount: 2_500,
  monthlyIncome: 10_000,
  occupation: "Analista de sistemas",
  score: 750,
  incomeCommitment: 25,
  riskLevel: "low",
  status: "approved",
  decisionReasonCode: "eligible",
};

const createTemporaryDirectory = async (): Promise<string> => {
  const directory = await fileSystem.mkdtemp(
    join(tmpdir(), "credit-decision-analytics-"),
  );

  temporaryDirectories.push(directory);

  return directory;
};

const createSource = (
  records: AnalyticsProposalSourceRecord[],
  close = vi.fn(async () => Promise.resolve()),
): AnalyticsProposalSource => ({
  open: async () => {
    const iterator = (async function* () {
      yield* records;
    })();

    return Object.assign(iterator, { close }) as AnalyticsProposalCursor;
  },
});

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(async (directory) => {
      await fileSystem.rm(directory, { force: true, recursive: true });
    }),
  );
});

describe("analytics proposal export", () => {
  test("should export one strict and valid NDJSON row per proposal", async () => {
    const directory = await createTemporaryDirectory();
    const outputPath = join(directory, "proposals.ndjson");

    const result = await exportAnalyticsProposals({
      outputPath,
      source: createSource([validRecord]),
    });

    const content = await fileSystem.readFile(outputPath, "utf8");
    const rows = content.trimEnd().split("\n");
    const parsedRow = analyticsProposalSchema.parse(JSON.parse(rows[0] ?? ""));

    expect(result).toEqual({ outputPath, recordCount: 1 });
    expect(rows).toHaveLength(1);
    expect(parsedRow).toEqual({
      exportVersion: "1",
      proposalId: validRecord.proposalId.toHexString(),
      customerId: validRecord.customerId.toHexString(),
      createdAt: validRecord.createdAt.toISOString(),
      updatedAt: validRecord.updatedAt.toISOString(),
      requestedAmount: 60_000,
      installments: 24,
      estimatedInstallment: 2_500,
      monthlyIncome: 10_000,
      occupation: "Analista de sistemas",
      score: 750,
      incomeCommitment: 25,
      risk: "low",
      status: "approved",
      decisionReason: "eligible",
    });
    expect(Object.keys(parsedRow)).not.toEqual(
      expect.arrayContaining([
        "_id",
        "__v",
        "name",
        "document",
        "email",
        "phone",
        "seedKey",
        "history",
      ]),
    );
  });

  test("should produce identical content for the same ordered source", async () => {
    const directory = await createTemporaryDirectory();
    const firstPath = join(directory, "first.ndjson");
    const secondPath = join(directory, "second.ndjson");
    const records = [
      validRecord,
      {
        ...validRecord,
        proposalId: new Types.ObjectId("507f1f77bcf86cd799439013"),
      },
    ];

    await exportAnalyticsProposals({
      outputPath: firstPath,
      source: createSource(records),
    });
    await exportAnalyticsProposals({
      outputPath: secondPath,
      source: createSource(records),
    });

    await expect(fileSystem.readFile(firstPath, "utf8")).resolves.toBe(
      await fileSystem.readFile(secondPath, "utf8"),
    );
  });

  test("should sort MongoDB proposals by stable identifier", () => {
    expect(analyticsProposalPipeline[0]).toEqual({
      $sort: {
        _id: 1,
      },
    });
  });

  test("should close the cursor after a successful export", async () => {
    const directory = await createTemporaryDirectory();
    const close = vi.fn(async () => Promise.resolve());

    await exportAnalyticsProposals({
      outputPath: join(directory, "proposals.ndjson"),
      source: createSource([validRecord], close),
    });

    expect(close).toHaveBeenCalledOnce();
  });

  test("should remove partial output and close the cursor after a read failure", async () => {
    const directory = await createTemporaryDirectory();
    const outputPath = join(directory, "proposals.ndjson");
    const close = vi.fn(async () => Promise.resolve());
    const source: AnalyticsProposalSource = {
      open: async () => {
        const iterator = (async function* () {
          yield validRecord;
          throw new Error("Falha de leitura");
        })();

        return Object.assign(iterator, { close }) as AnalyticsProposalCursor;
      },
    };

    await expect(
      exportAnalyticsProposals({ outputPath, source }),
    ).rejects.toThrow("Falha de leitura");
    await expect(fileSystem.stat(outputPath)).rejects.toThrow();
    await expect(fileSystem.stat(`${outputPath}.partial`)).rejects.toThrow();
    expect(close).toHaveBeenCalledOnce();
  });

  test("should remove partial output and close the cursor after a write failure", async () => {
    const directory = await createTemporaryDirectory();
    const outputPath = join(directory, "proposals.ndjson");
    const close = vi.fn(async () => Promise.resolve());

    await expect(
      exportAnalyticsProposals({
        outputPath,
        source: createSource([validRecord], close),
        fileSystem: {
          createWriteStream: () =>
            new Writable({
              write(_chunk, _encoding, callback) {
                callback(new Error("Falha de escrita"));
              },
            }),
          makeDirectory: async (path) => {
            await fileSystem.mkdir(path, { recursive: true });
          },
          removeFile: async (path) => {
            await fileSystem.rm(path, { force: true });
          },
          renameFile: async (source, destination) => {
            await fileSystem.rename(source, destination);
          },
        },
      }),
    ).rejects.toThrow("Falha de escrita");
    await expect(fileSystem.stat(outputPath)).rejects.toThrow();
    await expect(fileSystem.stat(`${outputPath}.partial`)).rejects.toThrow();
    expect(close).toHaveBeenCalledOnce();
  });

  test("should reject an invalid analytical row without publishing a file", async () => {
    const directory = await createTemporaryDirectory();
    const outputPath = join(directory, "proposals.ndjson");
    const invalidRecord = {
      ...validRecord,
      monthlyIncome: 0,
      incomeCommitment: 10,
    };

    await expect(
      exportAnalyticsProposals({
        outputPath,
        source: createSource([invalidRecord]),
      }),
    ).rejects.toThrow();
    await expect(fileSystem.stat(outputPath)).rejects.toThrow();
    await expect(fileSystem.stat(`${outputPath}.partial`)).rejects.toThrow();
  });
});
