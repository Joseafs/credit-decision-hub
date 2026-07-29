import type { HealthResponse } from "@credit-decision-hub/contracts";
import type { z } from "zod";

import type { healthCheckSchema } from "./validation";

export type HealthCheckValues = z.infer<typeof healthCheckSchema>;

export type HealthRequestState =
  | { status: "loading" }
  | { status: "success"; data: HealthResponse }
  | { status: "error" };
