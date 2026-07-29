import type { AuditEvent } from "@credit-decision-hub/contracts";
import { describe, expect, test, vi } from "vitest";

import type { DashboardRepository } from "./dashboard.repository.js";
import { createDashboardService } from "./dashboard.service.js";

const auditEvent: AuditEvent = {
  id: "670000000000000000000001",
  proposalId: "660000000000000000000001",
  actorId: "650000000000000000000001",
  actorName: "Analista Demo",
  fromStatus: "manual_review",
  toStatus: "approved",
  reasonCode: "manual_approval",
  reason: "Documentação conferida",
  createdAt: "2026-07-29T13:00:00.000Z",
};

describe("dashboard service", () => {
  test("should build audit pagination from the repository result", async () => {
    const repository = {
      getSummary: vi.fn(),
      findAuditPage: vi.fn(async () => ({
        data: [auditEvent],
        total: 21,
      })),
    } satisfies DashboardRepository;
    const service = createDashboardService(repository);

    const response = await service.listAuditEvents({ page: 2, limit: 10 });

    expect(response).toEqual({
      data: [auditEvent],
      pagination: {
        page: 2,
        limit: 10,
        total: 21,
        totalPages: 3,
      },
    });
  });
});
