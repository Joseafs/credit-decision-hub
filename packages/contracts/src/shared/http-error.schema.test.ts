import { describe, expect, test } from "vitest";

import {
  apiErrorResponseSchema,
  validationErrorResponseSchema,
} from "./http-error.schema.js";

describe("HTTP error schemas", () => {
  test("should validate a domain error response", () => {
    expect(
      apiErrorResponseSchema.parse({
        message: "Cliente não encontrado",
      }),
    ).toEqual({
      message: "Cliente não encontrado",
    });
  });

  test("should validate a detailed validation error response", () => {
    expect(
      validationErrorResponseSchema.parse({
        message: "Dados inválidos",
        issues: [
          {
            path: "monthlyIncome",
            message: "Too small: expected number to be >=0",
          },
        ],
      }),
    ).toEqual({
      message: "Dados inválidos",
      issues: [
        {
          path: "monthlyIncome",
          message: "Too small: expected number to be >=0",
        },
      ],
    });
  });

  test("should reject undocumented properties", () => {
    expect(
      validationErrorResponseSchema.safeParse({
        message: "Dados inválidos",
        issues: [],
        internalCode: "VALIDATION_ERROR",
      }).success,
    ).toBe(false);
  });
});
