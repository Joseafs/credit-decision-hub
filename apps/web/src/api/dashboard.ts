import {
  analyticsSummarySchema,
  auditEventListResponseSchema,
  dashboardSummarySchema,
  listAuditEventsQuerySchema,
  type AnalyticsSummary,
  type AuditEventListResponse,
  type DashboardSummary,
  type ListAuditEventsQuery,
} from "@credit-decision-hub/contracts";

import { requestJson } from "./http";

const AUDIT_PAGE_LIMIT = 10;

export const getDashboardSummary = (
  signal?: AbortSignal,
): Promise<DashboardSummary> =>
  requestJson(
    "/api/dashboard",
    dashboardSummarySchema,
    signal ? { signal } : undefined,
  );

export const getAnalyticsSummary = (
  signal?: AbortSignal,
): Promise<AnalyticsSummary> =>
  requestJson(
    "/api/analytics/summary",
    analyticsSummarySchema,
    signal ? { signal } : undefined,
  );

export const parseAuditListQuery = (
  searchParams: URLSearchParams,
): ListAuditEventsQuery =>
  listAuditEventsQuerySchema.parse({
    ...Object.fromEntries(searchParams),
    limit: searchParams.get("limit") ?? AUDIT_PAGE_LIMIT,
  });

export const serializeAuditListQuery = (
  input: ListAuditEventsQuery,
): URLSearchParams => {
  const query = listAuditEventsQuerySchema.parse(input);
  const searchParams = new URLSearchParams();

  if (query.page > 1) {
    searchParams.set("page", String(query.page));
  }

  if (query.limit !== AUDIT_PAGE_LIMIT) {
    searchParams.set("limit", String(query.limit));
  }

  return searchParams;
};

export const listAuditEvents = (
  input: ListAuditEventsQuery,
  signal?: AbortSignal,
): Promise<AuditEventListResponse> => {
  const searchParams = new URLSearchParams({
    page: String(input.page),
    limit: String(input.limit),
  });

  return requestJson(
    `/api/audit-events?${searchParams.toString()}`,
    auditEventListResponseSchema,
    signal ? { signal } : undefined,
  );
};
