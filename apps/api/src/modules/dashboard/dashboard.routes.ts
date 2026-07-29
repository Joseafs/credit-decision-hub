import {
  apiErrorResponseSchema,
  auditEventListResponseSchema,
  dashboardSummarySchema,
  listAuditEventsQuerySchema,
} from "@credit-decision-hub/contracts";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import type { DashboardService } from "./dashboard.service.js";

type DashboardRoutesOptions = {
  dashboardService: DashboardService;
  protectedRoutes?: boolean;
};

export const dashboardRoutes: FastifyPluginAsyncZod<
  DashboardRoutesOptions
> = async (app, { dashboardService, protectedRoutes = false }) => {
  app.get(
    "/dashboard",
    {
      ...(protectedRoutes ? { onRequest: app.authenticate } : {}),
      schema: {
        tags: ["Dashboard"],
        summary: "Consultar indicadores operacionais",
        operationId: "getDashboardSummary",
        response: {
          200: dashboardSummarySchema,
          401: apiErrorResponseSchema,
        },
      },
    },
    async (request, reply) =>
      reply
        .status(200)
        .send(await dashboardService.getSummary(request.currentUser.id)),
  );

  app.get(
    "/audit-events",
    {
      ...(protectedRoutes ? { onRequest: app.authenticate } : {}),
      schema: {
        tags: ["Auditoria"],
        summary: "Listar decisões manuais auditáveis",
        operationId: "listAuditEvents",
        querystring: listAuditEventsQuerySchema,
        response: {
          200: auditEventListResponseSchema,
          401: apiErrorResponseSchema,
        },
      },
    },
    async (request, reply) =>
      reply
        .status(200)
        .send(await dashboardService.listAuditEvents(request.query)),
  );
};
