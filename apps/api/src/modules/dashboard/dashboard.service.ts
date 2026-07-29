import {
  auditEventListResponseSchema,
  type AuditEventListResponse,
  type DashboardSummary,
  type ListAuditEventsQuery,
} from "@credit-decision-hub/contracts";

import type { DashboardRepository } from "./dashboard.repository.js";

export type DashboardService = {
  getSummary(actorId: string): Promise<DashboardSummary>;
  listAuditEvents(query: ListAuditEventsQuery): Promise<AuditEventListResponse>;
};

export const createDashboardService = (
  repository: DashboardRepository,
): DashboardService => ({
  getSummary: (actorId) => repository.getSummary(actorId),

  async listAuditEvents(query) {
    const page = await repository.findAuditPage(query);

    return auditEventListResponseSchema.parse({
      data: page.data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: page.total,
        totalPages: Math.ceil(page.total / query.limit),
      },
    });
  },
});
