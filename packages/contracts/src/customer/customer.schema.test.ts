import { describe, expect, test } from "vitest";

import {
  createCustomerSchema,
  customerListResponseSchema,
  listCustomersQuerySchema,
} from "./customer.schema.js";

describe("customer contracts", () => {
  test("should normalize a valid customer input", () => {
    const customer = createCustomerSchema.parse({
      name: "  Maria Oliveira  ",
      document: " DOC-1001 ",
      email: " MARIA@EXAMPLE.COM ",
      phone: " 11999999999 ",
      monthlyIncome: 8_500,
      occupation: " Analista de dados ",
    });

    expect(customer).toEqual({
      name: "Maria Oliveira",
      document: "DOC-1001",
      email: "maria@example.com",
      phone: "11999999999",
      monthlyIncome: 8_500,
      occupation: "Analista de dados",
    });
  });

  test("should reject a negative monthly income", () => {
    const result = createCustomerSchema.safeParse({
      name: "Maria Oliveira",
      document: "DOC-1001",
      email: "maria@example.com",
      phone: "11999999999",
      monthlyIncome: -1,
      occupation: "Analista de dados",
    });

    expect(result.success).toBe(false);
  });

  test("should coerce pagination values from query strings", () => {
    expect(
      listCustomersQuerySchema.parse({
        page: "2",
        limit: "10",
      }),
    ).toEqual({
      page: 2,
      limit: 10,
    });
  });

  test("should validate a paginated customer response", () => {
    const result = customerListResponseSchema.safeParse({
      data: [
        {
          id: "507f1f77bcf86cd799439011",
          name: "Maria Oliveira",
          document: "DOC-1001",
          email: "maria@example.com",
          phone: "11999999999",
          monthlyIncome: 8_500,
          occupation: "Analista de dados",
          createdAt: "2026-07-29T17:00:00.000Z",
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    });

    expect(result.success).toBe(true);
  });
});
