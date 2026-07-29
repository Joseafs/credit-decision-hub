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

const webOriginSchema = z
  .url()
  .refine((value) => {
    const url = new URL(value);
    return url.pathname === "/" && url.search === "" && url.hash === "";
  }, "WEB_ORIGIN deve conter somente protocolo e host")
  .transform((value) => new URL(value).origin);

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
    AUTH_JWT_SECRET: z.string().min(32),
    AUTH_SECURE_COOKIE: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    WEB_ORIGIN: webOriginSchema.optional(),
    DATABRICKS_HOST: z.url().optional(),
    DATABRICKS_TOKEN: z.string().trim().min(1).optional(),
    DATABRICKS_WAREHOUSE_ID: z.string().trim().min(1).optional(),
  })
  .superRefine((environment, context) => {
    const databricksValues = [
      environment.DATABRICKS_HOST,
      environment.DATABRICKS_TOKEN,
      environment.DATABRICKS_WAREHOUSE_ID,
    ];
    const configuredValues = databricksValues.filter(
      (value) => value !== undefined,
    );

    if (
      configuredValues.length > 0 &&
      configuredValues.length < databricksValues.length
    ) {
      context.addIssue({
        code: "custom",
        message:
          "DATABRICKS_HOST, DATABRICKS_TOKEN e DATABRICKS_WAREHOUSE_ID devem ser configurados juntos",
        path: ["DATABRICKS_HOST"],
      });
    }
  })
  .transform(
    ({
      AUTH_JWT_SECRET,
      AUTH_SECURE_COOKIE,
      DATABRICKS_HOST,
      DATABRICKS_TOKEN,
      DATABRICKS_WAREHOUSE_ID,
      MONGODB_DATABASE,
      MONGODB_DNS_SERVERS,
      MONGODB_URI,
      PORT,
      WEB_ORIGIN,
    }) => ({
      authJwtSecret: AUTH_JWT_SECRET,
      authSecureCookie: AUTH_SECURE_COOKIE,
      databricks:
        DATABRICKS_HOST && DATABRICKS_TOKEN && DATABRICKS_WAREHOUSE_ID
          ? {
              host: DATABRICKS_HOST.replace(/\/+$/, ""),
              token: DATABRICKS_TOKEN,
              warehouseId: DATABRICKS_WAREHOUSE_ID,
            }
          : null,
      dnsServers: MONGODB_DNS_SERVERS,
      port: PORT,
      mongodbDatabase: MONGODB_DATABASE,
      mongodbUri: MONGODB_URI,
      webOrigin: WEB_ORIGIN ?? null,
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
