import type { CustomerListResponse } from "@credit-decision-hub/contracts";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { listCustomers } from "../../api/customers";
import { CustomerList } from "../../components/CustomerList";
import { FeedbackState } from "../../components/FeedbackState";
import { useAppPreferences } from "../../contexts/AppPreferencesContext";

type CustomersState =
  | { status: "loading" }
  | { status: "success"; response: CustomerListResponse }
  | { status: "error" };

export const CustomersPage = () => {
  const [page, setPage] = useState(1);
  const [customersState, setCustomersState] = useState<CustomersState>({
    status: "loading",
  });
  const { locale, translate } = useAppPreferences();

  const loadCustomers = useCallback(
    async (signal?: AbortSignal) => {
      setCustomersState({ status: "loading" });

      try {
        const response = await listCustomers(page, signal);
        setCustomersState({ status: "success", response });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setCustomersState({ status: "error" });
      }
    },
    [page],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadCustomers(controller.signal);

    return () => controller.abort();
  }, [loadCustomers]);

  return (
    <section>
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            {translate("customers.eyebrow")}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-heading sm:text-4xl">
            {translate("customers.title")}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted">
            {translate("customers.description")}
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary shadow-lg shadow-primary/20 transition hover:bg-primary-hover"
          to="/customers/new"
        >
          <span aria-hidden="true" className="mr-2 text-xl leading-none">
            +
          </span>
          {translate("customers.new")}
        </Link>
      </header>

      <div className="mt-8">
        {customersState.status === "loading" && (
          <FeedbackState title={translate("customers.loading")} />
        )}

        {customersState.status === "error" && (
          <FeedbackState
            action={
              <button
                className="rounded-lg bg-danger px-4 py-2 font-semibold text-white"
                onClick={() => void loadCustomers()}
                type="button"
              >
                {translate("customers.retry")}
              </button>
            }
            description={translate("customers.errorDescription")}
            title={translate("customers.errorTitle")}
            tone="danger"
          />
        )}

        {customersState.status === "success" &&
          customersState.response.data.length === 0 && (
            <FeedbackState
              action={
                <Link
                  className="inline-flex rounded-lg bg-primary px-4 py-2 font-semibold text-on-primary"
                  to="/customers/new"
                >
                  {translate("customers.new")}
                </Link>
              }
              description={translate("customers.emptyDescription")}
              title={translate("customers.emptyTitle")}
            />
          )}

        {customersState.status === "success" &&
          customersState.response.data.length > 0 && (
            <>
              <CustomerList
                customers={customersState.response.data}
                locale={locale}
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
                  {translate("customers.pagination.previous")}
                </button>
                <p className="text-sm text-muted">
                  {translate("customers.pagination.summary", {
                    page: customersState.response.pagination.page,
                    totalPages: customersState.response.pagination.totalPages,
                  })}
                </p>
                <button
                  className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-heading transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={
                    page >= customersState.response.pagination.totalPages
                  }
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                  type="button"
                >
                  {translate("customers.pagination.next")}
                </button>
              </nav>
            </>
          )}
      </div>
    </section>
  );
};
