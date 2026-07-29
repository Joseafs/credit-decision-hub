import type { ProposalListResponse } from "@credit-decision-hub/contracts";
import { FeedbackState } from "@credit-decision-hub/ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  listProposals,
  parseProposalListQuery,
  serializeProposalListQuery,
} from "../../api/proposals";
import { ProposalList } from "../../components/ProposalList";
import { ProposalFilters } from "../../components/ProposalFilters";
import { useAppPreferences } from "../../contexts/AppPreferencesContext";

type ProposalsState =
  | { status: "loading" }
  | { status: "success"; response: ProposalListResponse }
  | { status: "error" };

export const ProposalsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [proposalsState, setProposalsState] = useState<ProposalsState>({
    status: "loading",
  });
  const { locale, translate } = useAppPreferences();
  const serializedSearch = searchParams.toString();
  const { query, hasInvalidQuery } = useMemo(() => {
    try {
      return {
        query: parseProposalListQuery(new URLSearchParams(serializedSearch)),
        hasInvalidQuery: false,
      };
    } catch {
      return {
        query: parseProposalListQuery(new URLSearchParams()),
        hasInvalidQuery: true,
      };
    }
  }, [serializedSearch]);
  const hasActiveFilters =
    query.customerId !== undefined ||
    query.status !== undefined ||
    query.riskLevel !== undefined ||
    query.createdFrom !== undefined ||
    query.createdTo !== undefined ||
    query.minRequestedAmount !== undefined ||
    query.maxRequestedAmount !== undefined;

  useEffect(() => {
    if (hasInvalidQuery) {
      setSearchParams(serializeProposalListQuery(query), { replace: true });
    }
  }, [hasInvalidQuery, query, setSearchParams]);

  const loadProposals = useCallback(
    async (signal?: AbortSignal) => {
      setProposalsState({ status: "loading" });

      try {
        const response = await listProposals(query, signal);
        setProposalsState({ status: "success", response });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setProposalsState({ status: "error" });
      }
    },
    [query],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadProposals(controller.signal);

    return () => controller.abort();
  }, [loadProposals]);

  return (
    <section>
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            {translate("proposals.eyebrow")}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-heading sm:text-4xl">
            {translate("proposals.title")}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted">
            {translate("proposals.description")}
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary shadow-lg shadow-primary/20 transition hover:bg-primary-hover"
          to="/proposals/new"
        >
          <span aria-hidden="true" className="mr-2 text-xl leading-none">
            +
          </span>
          {translate("proposals.new")}
        </Link>
      </header>

      <div className="mt-8">
        <ProposalFilters
          onApply={(nextQuery) =>
            setSearchParams(serializeProposalListQuery(nextQuery))
          }
          onClear={() =>
            setSearchParams(
              serializeProposalListQuery({ page: 1, limit: query.limit }),
            )
          }
          query={query}
        />

        <div className="mt-6">
          {proposalsState.status === "loading" && (
            <FeedbackState title={translate("proposals.loading")} />
          )}

          {proposalsState.status === "error" && (
            <FeedbackState
              action={
                <button
                  className="rounded-lg bg-danger px-4 py-2 font-semibold text-white"
                  onClick={() => void loadProposals()}
                  type="button"
                >
                  {translate("proposals.retry")}
                </button>
              }
              description={translate("proposals.errorDescription")}
              title={translate("proposals.errorTitle")}
              tone="danger"
            />
          )}

          {proposalsState.status === "success" &&
            proposalsState.response.data.length === 0 && (
              <FeedbackState
                action={
                  hasActiveFilters ? (
                    <button
                      className="inline-flex rounded-lg bg-primary px-4 py-2 font-semibold text-on-primary"
                      onClick={() =>
                        setSearchParams(
                          serializeProposalListQuery({
                            page: 1,
                            limit: query.limit,
                          }),
                        )
                      }
                      type="button"
                    >
                      {translate("proposals.filters.clear")}
                    </button>
                  ) : (
                    <Link
                      className="inline-flex rounded-lg bg-primary px-4 py-2 font-semibold text-on-primary"
                      to="/proposals/new"
                    >
                      {translate("proposals.new")}
                    </Link>
                  )
                }
                description={translate(
                  hasActiveFilters
                    ? "proposals.filteredEmptyDescription"
                    : "proposals.emptyDescription",
                )}
                title={translate(
                  hasActiveFilters
                    ? "proposals.filteredEmptyTitle"
                    : "proposals.emptyTitle",
                )}
              />
            )}

          {proposalsState.status === "success" &&
            proposalsState.response.data.length > 0 && (
              <>
                <ProposalList
                  locale={locale}
                  proposals={proposalsState.response.data}
                />
                <nav
                  aria-label={translate("nav.paginationLabel")}
                  className="mt-5 flex items-center justify-between gap-4"
                >
                  <button
                    className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-heading transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-45"
                    disabled={query.page === 1}
                    onClick={() =>
                      setSearchParams(
                        serializeProposalListQuery({
                          ...query,
                          page: query.page - 1,
                        }),
                      )
                    }
                    type="button"
                  >
                    {translate("proposals.pagination.previous")}
                  </button>
                  <p className="text-sm text-muted">
                    {translate("proposals.pagination.summary", {
                      page: proposalsState.response.pagination.page,
                      totalPages: proposalsState.response.pagination.totalPages,
                    })}
                  </p>
                  <button
                    className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-heading transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-45"
                    disabled={
                      query.page >=
                      proposalsState.response.pagination.totalPages
                    }
                    onClick={() =>
                      setSearchParams(
                        serializeProposalListQuery({
                          ...query,
                          page: query.page + 1,
                        }),
                      )
                    }
                    type="button"
                  >
                    {translate("proposals.pagination.next")}
                  </button>
                </nav>
              </>
            )}
        </div>
      </div>
    </section>
  );
};
