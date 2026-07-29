import {
  apiErrorResponseSchema,
  validationErrorResponseSchema,
  type ValidationErrorResponse,
} from "@credit-decision-hub/contracts";
import type { z } from "zod";

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly issues: ValidationErrorResponse["issues"] = [],
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

const parseError = async (response: Response): Promise<ApiRequestError> => {
  const payload: unknown = await response.json().catch(() => null);
  const validationError = validationErrorResponseSchema.safeParse(payload);

  if (validationError.success) {
    return new ApiRequestError(
      response.status,
      validationError.data.message,
      validationError.data.issues,
    );
  }

  const apiError = apiErrorResponseSchema.safeParse(payload);

  return new ApiRequestError(
    response.status,
    apiError.success ? apiError.data.message : "Unexpected API response",
  );
};

export const requestJson = async <Output>(
  path: string,
  schema: z.ZodType<Output>,
  init?: RequestInit,
): Promise<Output> => {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return schema.parse(await response.json());
};
