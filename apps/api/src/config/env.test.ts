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
      dnsServers: ["8.8.8.8", "8.8.4.4"],
      mongodbDatabase: "credit-test",
      mongodbUri: "mongodb+srv://user:password@example.mongodb.net/",
      port: 4000,
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
});
