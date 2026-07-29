import type { ProposalListResponse } from "@credit-decision-hub/contracts";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { listProposals } from "../../api/proposals";
import { FeedbackState } from "../../components/FeedbackState";
import { ProposalList } from "../../components/ProposalList";
import { useAppPreferences } from "../../contexts/AppPreferencesContext";

type ProposalsState =
  | { status: "loading" }
  | { status: "success"; response: ProposalListResponse }
  | { status: "error" };

export const ProposalsPage = () => {
  const [page, setPage] = useState(1);
  const [proposalsState, setProposalsState] = useState<ProposalsState>({
    status: "loading",
  });
  const { locale, translate } = useAppPreferences();

  const loadProposals = useCallback(
    async (signal?: AbortSignal) => {
      setProposalsState({ status: "loading" });

      try {
        const response = await listProposals(page, signal);
        setProposalsState({ status: "success", response });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setProposalsState({ status: "error" });
      }
    },
    [page],
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
                <Link
                  className="inline-flex rounded-lg bg-primary px-4 py-2 font-semibold text-on-primary"
                  to="/proposals/new"
                >
                  {translate("proposals.new")}
                </Link>
              }
              description={translate("proposals.emptyDescription")}
              title={translate("proposals.emptyTitle")}
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
                  disabled={page === 1}
                  onClick={() => setPage((currentPage) => currentPage - 1)}
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
                    page >= proposalsState.response.pagination.totalPages
                  }
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                  type="button"
                >
                  {translate("proposals.pagination.next")}
                </button>
              </nav>
            </>
          )}
      </div>
    </section>
  );
};
