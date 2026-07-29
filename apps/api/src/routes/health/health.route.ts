import {
  healthResponseSchema,
  type HealthResponse,
} from "@credit-decision-hub/contracts";
import type { FastifyPluginAsync } from "fastify";

const healthResponse: HealthResponse = healthResponseSchema.parse({
  status: "ok",
  service: "credit-decision-api",
});

export const healthRoute: FastifyPluginAsync = async (app) => {
  app.get("/health", async (_request, reply) => {
    return reply.status(200).send(healthResponse);
  });
};
