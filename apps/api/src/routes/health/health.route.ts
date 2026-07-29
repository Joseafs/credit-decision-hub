import {
  healthResponseSchema,
  type HealthResponse,
} from "@credit-decision-hub/contracts";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

const healthResponse: HealthResponse = healthResponseSchema.parse({
  status: "ok",
  service: "credit-decision-api",
});

const documentedHealthResponseSchema = healthResponseSchema.meta({
  description: "Estado operacional da API",
  examples: [healthResponse],
});

export const healthRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/health",
    {
      schema: {
        tags: ["Health"],
        summary: "Consultar estado da API",
        description:
          "Confirma que o processo da API está disponível para receber requisições.",
        operationId: "getHealth",
        response: {
          200: documentedHealthResponseSchema,
        },
      },
    },
    async (_request, reply) => reply.status(200).send(healthResponse),
  );
};
