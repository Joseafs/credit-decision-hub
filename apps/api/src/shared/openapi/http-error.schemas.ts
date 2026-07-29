import {
  apiErrorResponseSchema,
  validationErrorResponseSchema,
} from "@credit-decision-hub/contracts";

import { customerNotFoundExample, validationErrorExample } from "./examples.js";

export const documentedValidationErrorSchema =
  validationErrorResponseSchema.meta({
    description: "Falha de validação da requisição",
    examples: [validationErrorExample],
  });

export const documentedCustomerNotFoundSchema = apiErrorResponseSchema.meta({
  description: "Cliente não encontrado",
  examples: [customerNotFoundExample],
});
