import type { AuditEventListResponse } from "@credit-decision-hub/contracts";
import { FeedbackState } from "@credit-decision-hub/ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  listAuditEvents,
  parseAuditListQuery,
  serializeAuditListQuery,
} from "../../api/dashboard";
import { useAppPreferences } from "../../contexts/AppPreferencesContext";
import { formatDateTime } from "../../i18n/formatters";
import { proposalStatusTranslationKeys } from "../../i18n/proposalLabels";

type AuditState =
  | { status: "loading" }
  | { status: "success"; response: AuditEventListResponse }
  | { status: "error" };

export const AuditPage = () => {
  const { locale, translate } = useAppPreferences();
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<AuditState>({ status: "loading" });
  const serializedSearch = searchParams.toString();
  const query = useMemo(() => {
    try {
      return parseAuditListQuery(new URLSearchParams(serializedSearch));
    } catch {
      return parseAuditListQuery(new URLSearchParams());
    }
  }, [serializedSearch]);

  const loadAudit = useCallback(
    async (signal?: AbortSignal) => {
      setState({ status: "loading" });
      try {
        setState({
          status: "success",
          response: await listAuditEvents(query, signal),
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setState({ status: "error" });
      }
    },
    [query],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadAudit(controller.signal);
    return () => controller.abort();
  }, [loadAudit]);

  return (
    <section>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          {translate("audit.eyebrow")}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-heading sm:text-4xl">
          {translate("audit.title")}
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          {translate("audit.description")}
        </p>
      </header>

      <div className="mt-8">
        {state.status === "loading" && (
          <FeedbackState title={translate("audit.loading")} />
        )}
        {state.status === "error" && (
          <FeedbackState
            action={
              <button
                className="rounded-lg bg-danger px-4 py-2 font-semibold text-white"
                onClick={() => void loadAudit()}
                type="button"
              >
                {translate("audit.retry")}
              </button>
            }
            title={translate("audit.error")}
            tone="danger"
          />
        )}
        {state.status === "success" && state.response.data.length === 0 && (
          <FeedbackState
            description={translate("audit.emptyDescription")}
            title={translate("audit.emptyTitle")}
          />
        )}
        {state.status === "success" && state.response.data.length > 0 && (
          <>
            <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
              <table className="min-w-full divide-y divide-border text-left">
                <thead className="bg-surface-subtle text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-5 py-4">{translate("audit.actor")}</th>
                    <th className="px-5 py-4">
                      {translate("audit.transition")}
                    </th>
                    <th className="px-5 py-4">{translate("audit.reason")}</th>
                    <th className="px-5 py-4">
                      {translate("audit.createdAt")}
                    </th>
                    <th className="px-5 py-4">{translate("audit.proposal")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {state.response.data.map((event) => (
                    <tr key={event.id}>
                      <td className="px-5 py-4 font-medium text-heading">
                        {event.actorName ?? translate("audit.unknownActor")}
                      </td>
                      <td className="px-5 py-4 text-sm text-muted">
                        {translate(
                          proposalStatusTranslationKeys[event.fromStatus],
                        )}{" "}
                        →{" "}
                        {translate(
                          proposalStatusTranslationKeys[event.toStatus],
                        )}
                      </td>
                      <td className="max-w-md px-5 py-4 text-sm text-muted">
                        {event.reason}
                      </td>
                      <td className="px-5 py-4 text-sm text-muted">
                        {formatDateTime(event.createdAt, locale)}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          className="font-semibold text-primary hover:underline"
                          to={`/proposals/${event.proposalId}`}
                        >
                          {translate("audit.viewProposal")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <nav
              aria-label={translate("nav.paginationLabel")}
              className="mt-5 flex items-center justify-between gap-4"
            >
              <button
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-heading disabled:opacity-45"
                disabled={query.page === 1}
                onClick={() =>
                  setSearchParams(
                    serializeAuditListQuery({
                      ...query,
                      page: query.page - 1,
                    }),
                  )
                }
                type="button"
              >
                {translate("audit.previous")}
              </button>
              <p className="text-sm text-muted">
                {translate("audit.pagination", {
                  page: state.response.pagination.page,
                  totalPages: state.response.pagination.totalPages,
                })}
              </p>
              <button
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-heading disabled:opacity-45"
                disabled={query.page >= state.response.pagination.totalPages}
                onClick={() =>
                  setSearchParams(
                    serializeAuditListQuery({
                      ...query,
                      page: query.page + 1,
                    }),
                  )
                }
                type="button"
              >
                {translate("audit.next")}
              </button>
            </nav>
          </>
        )}
      </div>
    </section>
  );
};
