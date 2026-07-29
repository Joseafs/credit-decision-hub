import {
  healthResponseSchema,
  type HealthResponse,
} from "@credit-decision-hub/contracts";

export const getHealth = async (): Promise<HealthResponse> => {
  const response = await fetch("/api/health", {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return healthResponseSchema.parse(await response.json());
};
