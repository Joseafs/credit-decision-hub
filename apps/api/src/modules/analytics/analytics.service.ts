import type { AnalyticsSummary } from "@credit-decision-hub/contracts";

import type { AnalyticsRepository } from "./analytics.repository.js";

export class AnalyticsUnavailableError extends Error {
  constructor() {
    super("Indicadores analíticos temporariamente indisponíveis");
    this.name = "AnalyticsUnavailableError";
  }
}

export type AnalyticsService = {
  getSummary(): Promise<AnalyticsSummary>;
};

export const unavailableAnalyticsService: AnalyticsService = {
  getSummary: async () => {
    throw new AnalyticsUnavailableError();
  },
};

export const createAnalyticsService = (
  repository: AnalyticsRepository,
): AnalyticsService => ({
  async getSummary() {
    try {
      return await repository.getSummary();
    } catch {
      throw new AnalyticsUnavailableError();
    }
  },
});
