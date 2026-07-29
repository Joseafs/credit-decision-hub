import {
  healthResponseSchema,
  type HealthResponse,
} from "@credit-decision-hub/contracts";

import { resolveApiUrl } from "./api-url";

export const getHealth = async (): Promise<HealthResponse> => {
  const response = await fetch(resolveApiUrl("/api/health"), {
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return healthResponseSchema.parse(await response.json());
};
