import { z } from "zod";

export const healthCheckSchema = z.object({
  endpoint: z
    .string()
    .refine((endpoint) => endpoint === "/health", "Use o endpoint /health"),
});
