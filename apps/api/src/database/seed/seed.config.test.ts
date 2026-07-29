import { describe, expect, test } from "vitest";

import { DEMO_SEED_KEY, readSeedConfig } from "./seed.config.js";

const referenceDate = new Date("2026-07-29T12:00:00.000Z");

const validEnvironment = {
  SEED_ALLOW_WRITE: "true",
  SEED_DATABASE_CONFIRMATION: "credit-decision-hub",
  SEED_RANDOM_SEED: "42",
  SEED_REFERENCE_DATE: referenceDate.toISOString(),
};

describe("readSeedConfig", () => {
  test("should parse an explicitly authorized seed configuration", () => {
    const config = readSeedConfig(
      "credit-decision-hub",
      validEnvironment,
      new Date("2030-01-01T00:00:00.000Z"),
    );

    expect(config).toEqual({
      databaseName: "credit-decision-hub",
      randomSeed: 42,
      referenceDate,
      seedKey: DEMO_SEED_KEY,
    });
  });

  test("should reject execution without the explicit write flag", () => {
    expect(() =>
      readSeedConfig("credit-decision-hub", {
        ...validEnvironment,
        SEED_ALLOW_WRITE: "false",
      }),
    ).toThrow("SEED_ALLOW_WRITE deve ser true para autorizar a escrita");
  });

  test("should reject a database confirmation mismatch", () => {
    expect(() =>
      readSeedConfig("credit-decision-hub", {
        ...validEnvironment,
        SEED_DATABASE_CONFIRMATION: "another-database",
      }),
    ).toThrow(
      "SEED_DATABASE_CONFIRMATION deve corresponder exatamente a MONGODB_DATABASE",
    );
  });

  test.each([
    "credit-prod",
    "credit-production",
    "prod-credit",
    "credit_production_data",
  ])("should reject the production database %s", (databaseName) => {
    expect(() =>
      readSeedConfig(databaseName, {
        ...validEnvironment,
        SEED_DATABASE_CONFIRMATION: databaseName,
      }),
    ).toThrow("O seed não pode ser executado em banco de produção");
  });

  test("should use the current time when a reference date is not informed", () => {
    const config = readSeedConfig(
      "credit-decision-hub",
      {
        ...validEnvironment,
        SEED_REFERENCE_DATE: undefined,
      },
      referenceDate,
    );

    expect(config.referenceDate).toEqual(referenceDate);
  });
});
