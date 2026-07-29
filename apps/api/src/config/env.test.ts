import { describe, expect, test } from "vitest";

import { readEnvironment } from "./env.js";

describe("readEnvironment", () => {
  test("should parse the MongoDB configuration", () => {
    const environment = readEnvironment({
      MONGODB_URI: "mongodb+srv://user:password@example.mongodb.net/",
      MONGODB_DATABASE: "credit-test",
      MONGODB_DNS_SERVERS: "8.8.8.8, 8.8.4.4",
      PORT: "4000",
    });

    expect(environment).toEqual({
      dnsServers: ["8.8.8.8", "8.8.4.4"],
      mongodbDatabase: "credit-test",
      mongodbUri: "mongodb+srv://user:password@example.mongodb.net/",
      port: 4000,
    });
  });

  test("should apply safe defaults for optional variables", () => {
    const environment = readEnvironment({
      MONGODB_URI: "mongodb://localhost:27017",
    });

    expect(environment.mongodbDatabase).toBe("credit-decision-hub");
    expect(environment.dnsServers).toEqual([]);
    expect(environment.port).toBe(3333);
  });

  test("should reject an invalid MongoDB URI", () => {
    expect(() =>
      readEnvironment({
        MONGODB_URI: "https://example.com",
      }),
    ).toThrow("MONGODB_URI deve ser uma URI válida do MongoDB");
  });

  test("should reject an invalid DNS server", () => {
    expect(() =>
      readEnvironment({
        MONGODB_URI: "mongodb://localhost:27017",
        MONGODB_DNS_SERVERS: "invalid-server",
      }),
    ).toThrow("MONGODB_DNS_SERVERS deve conter endereços IP válidos");
  });
});
