import { describe, expect, test } from "vitest";

import { readEnvironment } from "./env.js";

describe("readEnvironment", () => {
  const authEnvironment = {
    AUTH_JWT_SECRET: "test-secret-with-at-least-32-characters",
  };

  test("should parse the MongoDB configuration", () => {
    const environment = readEnvironment({
      ...authEnvironment,
      MONGODB_URI: "mongodb+srv://user:password@example.mongodb.net/",
      MONGODB_DATABASE: "credit-test",
      MONGODB_DNS_SERVERS: "8.8.8.8, 8.8.4.4",
      PORT: "4000",
    });

    expect(environment).toEqual({
      authJwtSecret: authEnvironment.AUTH_JWT_SECRET,
      authSecureCookie: false,
      databricks: null,
      dnsServers: ["8.8.8.8", "8.8.4.4"],
      mongodbDatabase: "credit-test",
      mongodbUri: "mongodb+srv://user:password@example.mongodb.net/",
      port: 4000,
      webOrigin: null,
    });
  });

  test("should apply safe defaults for optional variables", () => {
    const environment = readEnvironment({
      ...authEnvironment,
      MONGODB_URI: "mongodb://localhost:27017",
    });

    expect(environment.mongodbDatabase).toBe("credit-decision-hub");
    expect(environment.dnsServers).toEqual([]);
    expect(environment.port).toBe(3333);
    expect(environment.webOrigin).toBeNull();
  });

  test("should parse an exact web origin for credentialed CORS", () => {
    const environment = readEnvironment({
      ...authEnvironment,
      MONGODB_URI: "mongodb://localhost:27017",
      WEB_ORIGIN: "https://credit-decision-hub.vercel.app/",
    });

    expect(environment.webOrigin).toBe(
      "https://credit-decision-hub.vercel.app",
    );
  });

  test("should reject a web origin containing a path", () => {
    expect(() =>
      readEnvironment({
        ...authEnvironment,
        MONGODB_URI: "mongodb://localhost:27017",
        WEB_ORIGIN: "https://credit-decision-hub.vercel.app/app",
      }),
    ).toThrow("WEB_ORIGIN deve conter somente protocolo e host");
  });

  test("should reject an invalid MongoDB URI", () => {
    expect(() =>
      readEnvironment({
        ...authEnvironment,
        MONGODB_URI: "https://example.com",
      }),
    ).toThrow("MONGODB_URI deve ser uma URI válida do MongoDB");
  });

  test("should reject an invalid DNS server", () => {
    expect(() =>
      readEnvironment({
        ...authEnvironment,
        MONGODB_URI: "mongodb://localhost:27017",
        MONGODB_DNS_SERVERS: "invalid-server",
      }),
    ).toThrow("MONGODB_DNS_SERVERS deve conter endereços IP válidos");
  });

  test("should parse a complete Databricks configuration", () => {
    const environment = readEnvironment({
      ...authEnvironment,
      MONGODB_URI: "mongodb://localhost:27017",
      DATABRICKS_HOST: "https://example.cloud.databricks.com/",
      DATABRICKS_TOKEN: "local-token",
      DATABRICKS_WAREHOUSE_ID: "warehouse-id",
    });

    expect(environment.databricks).toEqual({
      host: "https://example.cloud.databricks.com",
      token: "local-token",
      warehouseId: "warehouse-id",
    });
  });

  test("should reject a partial Databricks configuration", () => {
    expect(() =>
      readEnvironment({
        ...authEnvironment,
        MONGODB_URI: "mongodb://localhost:27017",
        DATABRICKS_HOST: "https://example.cloud.databricks.com",
      }),
    ).toThrow(
      "DATABRICKS_HOST, DATABRICKS_TOKEN e DATABRICKS_WAREHOUSE_ID devem ser configurados juntos",
    );
  });
});
