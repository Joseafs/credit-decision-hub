import {
  proposalFraudSignalValues,
  type ProposalFraudSignal,
} from "@credit-decision-hub/contracts";
import { useFormik } from "formik";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { listCustomers } from "../../api/customers";
import { ApiRequestError } from "../../api/http";
import { createProposal } from "../../api/proposals";
import { useAppPreferences } from "../../contexts/AppPreferencesContext";
import { proposalFraudSignalTranslationKeys } from "../../i18n/proposalLabels";
import type { TranslationKey } from "../../i18n/translations";
import type { CustomerOptionsState, ProposalFormValues } from "./types";
import { parseProposalForm, validateProposalForm } from "./validation";

const CUSTOMER_OPTIONS_LIMIT = 100;

const initialValues: ProposalFormValues = {
  customerId: "",
  requestedAmount: "",
  installments: "",
  score: "",
  documentsComplete: true,
  fraudSignals: [],
};

const numericFields: Array<{
  label: TranslationKey;
  max?: string;
  min: string;
  name: "requestedAmount" | "installments" | "score";
  placeholder: string;
  step: string;
}> = [
  {
    label: "proposal.form.requestedAmount",
    min: "0.01",
    name: "requestedAmount",
    placeholder: "60000",
    step: "0.01",
  },
  {
    label: "proposal.form.installments",
    min: "1",
    max: "60",
    name: "installments",
    placeholder: "24",
    step: "1",
  },
  {
    label: "proposal.form.score",
    min: "0",
    max: "1000",
    name: "score",
    placeholder: "750",
    step: "1",
  },
];

export const ProposalCreatePage = () => {
  const [customerOptions, setCustomerOptions] = useState<CustomerOptionsState>({
    status: "loading",
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { translate } = useAppPreferences();

  const loadCustomerOptions = useCallback(async (signal?: AbortSignal) => {
    setCustomerOptions({ status: "loading" });

    try {
      const response = await listCustomers(
        { page: 1, limit: CUSTOMER_OPTIONS_LIMIT },
        signal,
      );
      setCustomerOptions({
        status: "success",
        customers: response.data,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setCustomerOptions({ status: "error" });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadCustomerOptions(controller.signal);

    return () => controller.abort();
  }, [loadCustomerOptions]);

  const formik = useFormik<ProposalFormValues>({
    initialValues,
    validate: (values) =>
      validateProposalForm(values, translate("proposal.form.invalid")),
    onSubmit: async (values) => {
      setSubmitError(null);

      try {
        const proposal = await createProposal(parseProposalForm(values));
        navigate(`/proposals/${proposal.id}`, {
          state: { proposalCreated: true },
        });
      } catch (error) {
        setSubmitError(
          error instanceof ApiRequestError && error.status === 404
            ? translate("proposal.form.customerNotFound")
            : translate("proposal.form.error"),
        );
      }
    },
  });

  const toggleFraudSignal = (signal: ProposalFraudSignal) => {
    const fraudSignals = formik.values.fraudSignals.includes(signal)
      ? formik.values.fraudSignals.filter(
          (currentSignal) => currentSignal !== signal,
        )
      : [...formik.values.fraudSignals, signal];

    void formik.setFieldValue("fraudSignals", fraudSignals);
  };

  const hasCustomers =
    customerOptions.status === "success" &&
    customerOptions.customers.length > 0;

  return (
    <section className="mx-auto max-w-4xl">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          {translate("proposal.form.eyebrow")}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-heading sm:text-4xl">
          {translate("proposal.form.title")}
        </h1>
        <p className="mt-3 text-base text-muted">
          {translate("proposal.form.description")}
        </p>
      </header>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-8">
        <div className="mb-7 rounded-xl bg-warning-soft p-4 text-sm text-warning">
          {translate("proposal.form.notice")}
        </div>

        {submitError && (
          <p
            className="mb-6 rounded-xl bg-danger-soft p-4 text-sm font-medium text-danger"
            role="alert"
          >
            {submitError}
          </p>
        )}

        <form
          className="grid gap-6 sm:grid-cols-2"
          noValidate
          onSubmit={formik.handleSubmit}
        >
          <div className="sm:col-span-2">
            <label
              className="mb-2 block text-sm font-semibold text-heading"
              htmlFor="customerId"
            >
              {translate("proposal.form.customer")}
            </label>

            {customerOptions.status === "loading" && (
              <p
                className="rounded-xl bg-surface-subtle p-4 text-sm text-muted"
                role="status"
              >
                {translate("proposal.form.customerLoading")}
              </p>
            )}

            {customerOptions.status === "error" && (
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-danger-soft p-4 text-sm text-danger"
                role="alert"
              >
                <span>{translate("proposal.form.customerError")}</span>
                <button
                  className="font-semibold underline"
                  onClick={() => void loadCustomerOptions()}
                  type="button"
                >
                  {translate("proposals.retry")}
                </button>
              </div>
            )}

            {customerOptions.status === "success" &&
              customerOptions.customers.length === 0 && (
                <p className="rounded-xl bg-warning-soft p-4 text-sm text-warning">
                  {translate("proposal.form.noCustomers")}{" "}
                  <Link className="font-semibold underline" to="/customers/new">
                    {translate("customers.new")}
                  </Link>
                </p>
              )}

            {hasCustomers && (
              <>
                <select
                  aria-describedby={
                    formik.touched.customerId && formik.errors.customerId
                      ? "customerId-error"
                      : undefined
                  }
                  aria-invalid={
                    Boolean(formik.touched.customerId) &&
                    Boolean(formik.errors.customerId)
                  }
                  className="w-full rounded-xl border border-border bg-canvas px-4 py-3 text-heading outline-none transition focus:border-primary aria-invalid:border-danger"
                  id="customerId"
                  name="customerId"
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                  value={formik.values.customerId}
                >
                  <option value="">
                    {translate("proposal.form.customerPlaceholder")}
                  </option>
                  {customerOptions.customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} · {customer.document}
                    </option>
                  ))}
                </select>
                {formik.touched.customerId && formik.errors.customerId && (
                  <p className="mt-2 text-sm text-danger" id="customerId-error">
                    {formik.errors.customerId}
                  </p>
                )}
              </>
            )}
          </div>

          {numericFields.map((field) => {
            const hasError =
              Boolean(formik.touched[field.name]) &&
              Boolean(formik.errors[field.name]);

            return (
              <div
                className={
                  field.name === "requestedAmount" ? "sm:col-span-2" : undefined
                }
                key={field.name}
              >
                <label
                  className="mb-2 block text-sm font-semibold text-heading"
                  htmlFor={field.name}
                >
                  {translate(field.label)}
                </label>
                <input
                  aria-describedby={
                    hasError ? `${field.name}-error` : undefined
                  }
                  aria-invalid={hasError}
                  className="w-full rounded-xl border border-border bg-canvas px-4 py-3 text-heading outline-none transition placeholder:text-muted/70 focus:border-primary aria-invalid:border-danger"
                  id={field.name}
                  max={field.max}
                  min={field.min}
                  name={field.name}
                  onBlur={formik.handleBlur}
                  onChange={(event) =>
                    void formik.setFieldValue(
                      field.name,
                      event.currentTarget.value,
                    )
                  }
                  placeholder={field.placeholder}
                  step={field.step}
                  type="number"
                  value={formik.values[field.name]}
                />
                {hasError && (
                  <p
                    className="mt-2 text-sm text-danger"
                    id={`${field.name}-error`}
                  >
                    {formik.errors[field.name]}
                  </p>
                )}
              </div>
            );
          })}

          <div className="sm:col-span-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-canvas p-4">
              <input
                checked={formik.values.documentsComplete}
                className="h-5 w-5 accent-primary"
                name="documentsComplete"
                onChange={formik.handleChange}
                type="checkbox"
              />
              <span className="font-medium text-heading">
                {translate("proposal.form.documentsComplete")}
              </span>
            </label>
          </div>

          <fieldset className="sm:col-span-2">
            <legend className="text-sm font-semibold text-heading">
              {translate("proposal.form.fraudSignals")}
            </legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {proposalFraudSignalValues.map((signal) => (
                <label
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-canvas p-4"
                  key={signal}
                >
                  <input
                    checked={formik.values.fraudSignals.includes(signal)}
                    className="mt-0.5 h-5 w-5 accent-primary"
                    name="fraudSignals"
                    onChange={() => toggleFraudSignal(signal)}
                    type="checkbox"
                    value={signal}
                  />
                  <span className="text-sm font-medium text-heading">
                    {translate(proposalFraudSignalTranslationKeys[signal])}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-2 flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
            <Link
              className="inline-flex justify-center rounded-xl border border-border px-5 py-3 font-semibold text-heading transition hover:border-primary"
              to="/proposals"
            >
              {translate("proposal.form.cancel")}
            </Link>
            <button
              className="rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!hasCustomers || formik.isSubmitting}
              type="submit"
            >
              {formik.isSubmitting
                ? translate("proposal.form.submitting")
                : translate("proposal.form.submit")}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
