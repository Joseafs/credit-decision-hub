import { isIP } from "node:net";

import { z } from "zod";

const dnsServersSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) =>
    value
      ? value
          .split(",")
          .map((server) => server.trim())
          .filter(Boolean)
      : [],
  )
  .refine(
    (servers) => servers.every((server) => isIP(server) !== 0),
    "MONGODB_DNS_SERVERS deve conter endereços IP válidos",
  );

const environmentSchema = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65_535).default(3333),
    MONGODB_URI: z
      .string()
      .trim()
      .refine(
        (uri) =>
          uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://"),
        "MONGODB_URI deve ser uma URI válida do MongoDB",
      ),
    MONGODB_DATABASE: z.string().trim().min(1).default("credit-decision-hub"),
    MONGODB_DNS_SERVERS: dnsServersSchema,
  })
  .transform(
    ({ MONGODB_DATABASE, MONGODB_DNS_SERVERS, MONGODB_URI, PORT }) => ({
      dnsServers: MONGODB_DNS_SERVERS,
      port: PORT,
      mongodbDatabase: MONGODB_DATABASE,
      mongodbUri: MONGODB_URI,
    }),
  );

export type Environment = z.infer<typeof environmentSchema>;

const loadFileIfAvailable = (path: string): void => {
  try {
    process.loadEnvFile(path);
  } catch (error) {
    const isMissingFile =
      error instanceof Error && "code" in error && error.code === "ENOENT";

    if (!isMissingFile) {
      throw error;
    }
  }
};

export const loadEnvironmentFiles = (paths = [".env", ".env.local"]): void => {
  paths.forEach(loadFileIfAvailable);
};

export const readEnvironment = (
  source: NodeJS.ProcessEnv = process.env,
): Environment => environmentSchema.parse(source);
