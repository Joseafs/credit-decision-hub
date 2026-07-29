import {
  analyticsSummarySchema,
  apiErrorResponseSchema,
} from "@credit-decision-hub/contracts";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import {
  AnalyticsUnavailableError,
  type AnalyticsService,
} from "./analytics.service.js";

type AnalyticsRoutesOptions = {
  analyticsService: AnalyticsService;
  protectedRoutes?: boolean;
};

export const analyticsRoutes: FastifyPluginAsyncZod<
  AnalyticsRoutesOptions
> = async (app, { analyticsService, protectedRoutes = false }) => {
  app.get(
    "/analytics/summary",
    {
      ...(protectedRoutes ? { onRequest: app.authenticate } : {}),
      schema: {
        tags: ["Analytics"],
        summary: "Consultar indicadores processados pelo Databricks",
        operationId: "getAnalyticsSummary",
        response: {
          200: analyticsSummarySchema,
          401: apiErrorResponseSchema,
          503: apiErrorResponseSchema,
        },
      },
    },
    async (_request, reply) => {
      try {
        return reply.status(200).send(await analyticsService.getSummary());
      } catch (error) {
        if (error instanceof AnalyticsUnavailableError) {
          return reply.status(503).send({ message: error.message });
        }

        throw error;
      }
    },
  );
};
