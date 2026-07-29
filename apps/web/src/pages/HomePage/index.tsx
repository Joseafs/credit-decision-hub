import type { HealthResponse } from "@credit-decision-hub/contracts";
import { Button } from "@credit-decision-hub/ui";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getHealth } from "../../api/health";
import { useAppPreferences } from "../../contexts/AppPreferencesContext";

type HealthRequestState =
  | { status: "loading" }
  | { status: "success"; data: HealthResponse }
  | { status: "error" };

export const HomePage = () => {
  const [healthState, setHealthState] = useState<HealthRequestState>({
    status: "loading",
  });

  const { translate } = useAppPreferences();

  const checkHealth = useCallback(async () => {
    setHealthState({ status: "loading" });

    try {
      const data = await getHealth();
      setHealthState({ status: "success", data });
    } catch {
      setHealthState({ status: "error" });
    }
  }, []);

  useEffect(() => {
    void checkHealth();
  }, [checkHealth]);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-surface px-6 py-10 shadow-sm sm:px-10 lg:py-16">
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-primary-soft blur-3xl" />
      <div className="relative grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
        <div>
          <span className="inline-flex rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary">
            {translate("home.eyebrow")}
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-heading sm:text-5xl">
            {translate("home.title")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
            {translate("home.description")}
          </p>
          <Link
            className="mt-8 inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary shadow-lg shadow-primary/20 transition hover:bg-primary-hover"
            to="/customers"
          >
            {translate("home.action")}
          </Link>
        </div>

        <aside className="rounded-2xl border border-border bg-canvas/70 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted">GET /health</p>
              <h2 className="mt-1 text-xl font-semibold text-heading">
                {translate("home.apiTitle")}
              </h2>
            </div>

            <span
              aria-hidden="true"
              className={`mt-1 h-3 w-3 rounded-full ${
                healthState.status === "success"
                  ? "bg-success shadow-[0_0_16px_color-mix(in_srgb,var(--app-success)_70%,transparent)]"
                  : healthState.status === "error"
                    ? "bg-danger"
                    : "animate-pulse bg-warning"
              }`}
            />
          </div>

          <div className="mt-6 min-h-20" aria-live="polite">
            {healthState.status === "loading" && (
              <p className="text-warning">{translate("home.apiLoading")}</p>
            )}

            {healthState.status === "success" && (
              <div>
                <p className="font-medium text-success">
                  {translate("home.apiSuccess")}
                </p>
                <p className="mt-2 font-mono text-sm text-muted">
                  {healthState.data.service} · {healthState.data.status}
                </p>
              </div>
            )}

            {healthState.status === "error" && (
              <div>
                <p className="font-medium text-danger">
                  {translate("home.apiError")}
                </p>
                <p className="mt-2 text-sm text-muted">
                  {translate("home.apiErrorDescription")}
                </p>
              </div>
            )}
          </div>

          {healthState.status === "error" && (
            <Button
              className="mt-5"
              fullWidth
              onClick={() => void checkHealth()}
            >
              {translate("home.apiRetry")}
            </Button>
          )}
        </aside>
      </div>
    </section>
  );
};
