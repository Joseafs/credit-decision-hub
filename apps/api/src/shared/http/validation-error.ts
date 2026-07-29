import {
  validationErrorResponseSchema,
  type ValidationErrorResponse,
} from "@credit-decision-hub/contracts";
import type { FastifySchemaValidationError } from "fastify";

const toIssuePath = (instancePath: string): string =>
  instancePath.split("/").filter(Boolean).join(".");

export const toValidationErrorResponse = (
  errors: FastifySchemaValidationError[],
): ValidationErrorResponse =>
  validationErrorResponseSchema.parse({
    message: "Dados inválidos",
    issues: errors.map((error) => ({
      path: toIssuePath(error.instancePath),
      message: error.message ?? "Valor inválido",
    })),
  });
