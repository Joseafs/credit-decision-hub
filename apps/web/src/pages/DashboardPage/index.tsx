import type { DashboardSummary } from "@credit-decision-hub/contracts";
import { FeedbackState } from "@credit-decision-hub/ui";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getDashboardSummary } from "../../api/dashboard";
import { useAppPreferences } from "../../contexts/AppPreferencesContext";
import { useAuth } from "../../contexts/AuthContext";
import { formatCurrency, formatPercent } from "../../i18n/formatters";
import {
  proposalRiskTranslationKeys,
  proposalStatusTranslationKeys,
} from "../../i18n/proposalLabels";

type DashboardState =
  | { status: "loading" }
  | { status: "success"; summary: DashboardSummary }
  | { status: "error" };

export const DashboardPage = () => {
  const { locale, translate } = useAppPreferences();
  const { user } = useAuth();
  const [state, setState] = useState<DashboardState>({ status: "loading" });

  const loadSummary = useCallback(async (signal?: AbortSignal) => {
    setState({ status: "loading" });

    try {
      setState({
        status: "success",
        summary: await getDashboardSummary(signal),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setState({ status: "error" });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadSummary(controller.signal);
    return () => controller.abort();
  }, [loadSummary]);

  if (state.status === "loading") {
    return <FeedbackState title={translate("dashboard.loading")} />;
  }

  if (state.status === "error") {
    return (
      <FeedbackState
        action={
          <button
            className="rounded-lg bg-danger px-4 py-2 font-semibold text-white"
            onClick={() => void loadSummary()}
            type="button"
          >
            {translate("dashboard.retry")}
          </button>
        }
        description={translate("dashboard.errorDescription")}
        title={translate("dashboard.errorTitle")}
        tone="danger"
      />
    );
  }

  const { summary } = state;
  const roleDecisionCount =
    user?.role === "admin"
      ? summary.manualDecisionCount
      : summary.myDecisionCount;
  const metrics = [
    {
      label: translate("dashboard.totalProposals"),
      value: String(summary.totalProposals),
    },
    {
      label: translate("dashboard.totalRequestedAmount"),
      value: formatCurrency(summary.totalRequestedAmount, locale),
    },
    {
      label: translate("dashboard.approvalRate"),
      value: formatPercent(summary.approvalRate, locale),
    },
    {
      label: translate("dashboard.pendingActions"),
      value: String(summary.pendingActionCount),
    },
    {
      label: translate(
        user?.role === "admin"
          ? "dashboard.allManualDecisions"
          : "dashboard.myManualDecisions",
      ),
      value: String(roleDecisionCount),
    },
  ];

  return (
    <section>
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            {translate("dashboard.eyebrow")}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-heading sm:text-4xl">
            {translate("dashboard.title")}
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            {translate("dashboard.description")}
          </p>
        </div>
        <Link
          className="inline-flex rounded-xl border border-border bg-surface px-5 py-3 font-semibold text-heading hover:border-primary"
          to="/audit"
        >
          {translate("dashboard.viewAudit")}
        </Link>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <article
            className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
            key={metric.label}
          >
            <p className="text-sm text-muted">{metric.label}</p>
            <p className="mt-3 text-2xl font-bold text-heading">
              {metric.value}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-xl font-semibold text-heading">
            {translate("dashboard.byStatus")}
          </h2>
          <ul className="mt-5 space-y-4">
            {summary.statusDistribution.map(({ status, count }) => (
              <li
                className="flex items-center justify-between gap-4"
                key={status}
              >
                <span className="text-sm text-muted">
                  {translate(proposalStatusTranslationKeys[status])}
                </span>
                <strong className="text-heading">{count}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-xl font-semibold text-heading">
            {translate("dashboard.byRisk")}
          </h2>
          <ul className="mt-5 space-y-4">
            {summary.riskDistribution.map(({ riskLevel, count }) => (
              <li
                className="flex items-center justify-between gap-4"
                key={riskLevel}
              >
                <span className="text-sm text-muted">
                  {translate(proposalRiskTranslationKeys[riskLevel])}
                </span>
                <strong className="text-heading">{count}</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
};
