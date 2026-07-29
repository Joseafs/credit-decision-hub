import type { OpenAPIV3_1 } from "openapi-types";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { buildApp } from "../../app.js";

const app = buildApp();

beforeAll(async () => {
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

const documentedOperationIds = [
  "getHealth",
  "createCustomer",
  "listCustomers",
  "getCustomerById",
  "createProposal",
  "listProposals",
  "getProposalById",
];

const getOperationIds = (document: OpenAPIV3_1.Document): string[] =>
  Object.values(document.paths ?? {}).flatMap((path) => {
    if (path === undefined || "$ref" in path) {
      return [];
    }

    return [
      path.get?.operationId,
      path.post?.operationId,
      path.put?.operationId,
      path.patch?.operationId,
      path.delete?.operationId,
    ].filter((operationId): operationId is string => operationId !== undefined);
  });

describe("OpenAPI documentation", () => {
  test("should expose a navigable Swagger UI", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/documentation/",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");
    expect(response.body).toContain("Swagger UI");
  });

  test("should document only the existing business operations", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/documentation/json",
    });
    const document = response.json<OpenAPIV3_1.Document>();

    expect(response.statusCode).toBe(200);
    expect(document.openapi).toBe("3.1.0");
    expect(document.info).toMatchObject({
      title: "Credit Decision Hub API",
      version: "1.0.0",
    });
    expect(Object.keys(document.paths ?? {}).sort()).toEqual([
      "/customers",
      "/customers/{id}",
      "/health",
      "/proposals",
      "/proposals/{id}",
    ]);
    expect(getOperationIds(document).sort()).toEqual(
      [...documentedOperationIds].sort(),
    );
  });

  test("should expose fictitious examples generated from the route contracts", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/documentation/json",
    });
    const document = response.json<OpenAPIV3_1.Document>();
    const createCustomer = document.paths?.["/customers"]?.post;
    const requestBody = createCustomer?.requestBody;

    expect(requestBody).toBeDefined();
    if (requestBody === undefined || "$ref" in requestBody) {
      return;
    }

    expect(requestBody.content["application/json"]?.example).toMatchObject({
      document: "FAKE-000001",
      email: "marina.costa@example.test",
    });
    expect(createCustomer?.responses["201"]).toBeDefined();
    expect(createCustomer?.responses["400"]).toBeDefined();
    expect(createCustomer?.responses["409"]).toBeDefined();
  });
});
