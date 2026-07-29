import type { Customer } from "@credit-decision-hub/contracts";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { getCustomer } from "../../api/customers";
import { FeedbackState } from "../../components/FeedbackState";
import { useAppPreferences } from "../../contexts/AppPreferencesContext";
import { formatCurrency, formatDate } from "../../i18n/formatters";

type CustomerDetailsState =
  | { status: "loading" }
  | { status: "success"; customer: Customer }
  | { status: "error" };

const wasCustomerCreated = (state: unknown): boolean =>
  typeof state === "object" &&
  state !== null &&
  "customerCreated" in state &&
  state.customerCreated === true;

export const CustomerDetailsPage = () => {
  const { customerId = "" } = useParams();
  const location = useLocation();
  const [customerState, setCustomerState] = useState<CustomerDetailsState>({
    status: "loading",
  });
  const { locale, translate } = useAppPreferences();

  useEffect(() => {
    const controller = new AbortController();

    const loadCustomer = async () => {
      try {
        const customer = await getCustomer(customerId, controller.signal);
        setCustomerState({ status: "success", customer });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setCustomerState({ status: "error" });
      }
    };

    void loadCustomer();

    return () => controller.abort();
  }, [customerId]);

  if (customerState.status === "loading") {
    return <FeedbackState title={translate("customer.detail.loading")} />;
  }

  if (customerState.status === "error") {
    return (
      <FeedbackState
        action={
          <Link
            className="inline-flex rounded-lg bg-danger px-4 py-2 font-semibold text-white"
            to="/customers"
          >
            {translate("customer.detail.back")}
          </Link>
        }
        description={translate("customer.detail.errorDescription")}
        title={translate("customer.detail.errorTitle")}
        tone="danger"
      />
    );
  }

  const { customer } = customerState;

  return (
    <section className="mx-auto max-w-4xl">
      <Link
        className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary-hover"
        to="/customers"
      >
        <span aria-hidden="true" className="mr-2">
          ←
        </span>
        {translate("customer.detail.back")}
      </Link>

      {wasCustomerCreated(location.state) && (
        <p
          className="mt-6 rounded-xl bg-success-soft p-4 font-medium text-success"
          role="status"
        >
          {translate("customer.detail.created")}
        </p>
      )}

      <header className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="font-mono text-sm text-primary">
              {customer.document}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-heading">
              {customer.name}
            </h1>
          </div>
          <p className="rounded-lg bg-surface-subtle px-3 py-2 text-sm text-muted">
            {translate("customer.detail.createdAt")}{" "}
            {formatDate(customer.createdAt, locale)}
          </p>
        </div>
      </header>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <article className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-heading">
            {translate("customer.detail.contact")}
          </h2>
          <dl className="mt-5 space-y-4">
            <div>
              <dt className="text-sm text-muted">
                {translate("customer.form.email")}
              </dt>
              <dd className="mt-1 font-medium text-heading">
                {customer.email}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted">
                {translate("customer.form.phone")}
              </dt>
              <dd className="mt-1 font-medium text-heading">
                {customer.phone}
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-heading">
            {translate("customer.detail.financial")}
          </h2>
          <dl className="mt-5 space-y-4">
            <div>
              <dt className="text-sm text-muted">
                {translate("customer.form.occupation")}
              </dt>
              <dd className="mt-1 font-medium text-heading">
                {customer.occupation}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted">
                {translate("customer.form.monthlyIncome")}
              </dt>
              <dd className="mt-1 text-xl font-semibold text-heading">
                {formatCurrency(customer.monthlyIncome, locale)}
              </dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
  );
};
