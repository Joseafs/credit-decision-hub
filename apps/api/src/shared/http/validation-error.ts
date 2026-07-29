import type { ZodError } from "zod";

export const toValidationErrorResponse = (error: ZodError) => ({
  message: "Dados inválidos",
  issues: error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  })),
});
