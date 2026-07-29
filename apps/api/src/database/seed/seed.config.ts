import { z } from "zod";

export const DEMO_SEED_KEY = "cdh-demo-v1";

const DEFAULT_RANDOM_SEED = 20_260_729;

const seedEnvironmentSchema = z.object({
  SEED_ALLOW_WRITE: z.literal("true", {
    error: "SEED_ALLOW_WRITE deve ser true para autorizar a escrita",
  }),
  SEED_DATABASE_CONFIRMATION: z.string().trim().min(1),
  SEED_RANDOM_SEED: z.coerce
    .number()
    .int()
    .nonnegative()
    .default(DEFAULT_RANDOM_SEED),
  SEED_REFERENCE_DATE: z.iso.datetime().optional(),
});

export type SeedConfig = {
  databaseName: string;
  randomSeed: number;
  referenceDate: Date;
  seedKey: string;
};

const isProductionDatabase = (databaseName: string): boolean =>
  /(^|[-_])prod(uction)?($|[-_])/i.test(databaseName);

export const readSeedConfig = (
  databaseName: string,
  source: NodeJS.ProcessEnv = process.env,
  now: Date = new Date(),
): SeedConfig => {
  const environment = seedEnvironmentSchema.parse(source);

  if (environment.SEED_DATABASE_CONFIRMATION !== databaseName) {
    throw new Error(
      "SEED_DATABASE_CONFIRMATION deve corresponder exatamente a MONGODB_DATABASE",
    );
  }

  if (isProductionDatabase(databaseName)) {
    throw new Error("O seed não pode ser executado em banco de produção");
  }

  return {
    databaseName,
    randomSeed: environment.SEED_RANDOM_SEED,
    referenceDate:
      environment.SEED_REFERENCE_DATE === undefined
        ? now
        : new Date(environment.SEED_REFERENCE_DATE),
    seedKey: DEMO_SEED_KEY,
  };
};
