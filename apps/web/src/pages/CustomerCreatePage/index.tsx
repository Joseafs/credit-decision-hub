import { useFormik } from "formik";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { createCustomer } from "../../api/customers";
import { ApiRequestError } from "../../api/http";
import { useAppPreferences } from "../../contexts/AppPreferencesContext";
import type { TranslationKey } from "../../i18n/translations";
import type { CustomerFormValues } from "./types";
import { parseCustomerForm, validateCustomerForm } from "./validation";

const initialValues: CustomerFormValues = {
  name: "",
  document: "",
  email: "",
  phone: "",
  monthlyIncome: "",
  occupation: "",
};

const fields: Array<{
  name: keyof CustomerFormValues;
  label: TranslationKey;
  type: string;
  placeholder: string;
}> = [
  {
    name: "name",
    label: "customer.form.name",
    type: "text",
    placeholder: "Marina Costa",
  },
  {
    name: "document",
    label: "customer.form.document",
    type: "text",
    placeholder: "FAKE-000001",
  },
  {
    name: "email",
    label: "customer.form.email",
    type: "email",
    placeholder: "marina.costa@example.test",
  },
  {
    name: "phone",
    label: "customer.form.phone",
    type: "tel",
    placeholder: "+55 11 90000-0000",
  },
  {
    name: "monthlyIncome",
    label: "customer.form.monthlyIncome",
    type: "number",
    placeholder: "8500",
  },
  {
    name: "occupation",
    label: "customer.form.occupation",
    type: "text",
    placeholder: "Analista de sistemas",
  },
];

export const CustomerCreatePage = () => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { translate } = useAppPreferences();
  const formik = useFormik<CustomerFormValues>({
    initialValues,
    validate: (values) =>
      validateCustomerForm(values, translate("customer.form.invalid")),
    onSubmit: async (values) => {
      setSubmitError(null);

      try {
        const customer = await createCustomer(parseCustomerForm(values));
        navigate(`/customers/${customer.id}`, {
          state: { customerCreated: true },
        });
      } catch (error) {
        setSubmitError(
          error instanceof ApiRequestError && error.status === 409
            ? translate("customer.form.conflict")
            : translate("customer.form.error"),
        );
      }
    },
  });

  return (
    <section className="mx-auto max-w-3xl">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          {translate("customer.form.eyebrow")}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-heading sm:text-4xl">
          {translate("customer.form.title")}
        </h1>
        <p className="mt-3 text-base text-muted">
          {translate("customer.form.description")}
        </p>
      </header>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-8">
        <div className="mb-7 rounded-xl bg-warning-soft p-4 text-sm text-warning">
          {translate("customer.form.fakeDataNotice")}
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
          className="grid gap-5 sm:grid-cols-2"
          noValidate
          onSubmit={formik.handleSubmit}
        >
          {fields.map((field) => {
            const hasError =
              Boolean(formik.touched[field.name]) &&
              Boolean(formik.errors[field.name]);

            return (
              <div
                className={
                  field.name === "name" || field.name === "occupation"
                    ? "sm:col-span-2"
                    : undefined
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
                  min={field.name === "monthlyIncome" ? "0" : undefined}
                  name={field.name}
                  onBlur={formik.handleBlur}
                  onChange={
                    field.name === "monthlyIncome"
                      ? (event) =>
                          void formik.setFieldValue(
                            field.name,
                            event.currentTarget.value,
                          )
                      : formik.handleChange
                  }
                  placeholder={field.placeholder}
                  step={field.name === "monthlyIncome" ? "0.01" : undefined}
                  type={field.type}
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

          <div className="mt-2 flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
            <Link
              className="inline-flex justify-center rounded-xl border border-border px-5 py-3 font-semibold text-heading transition hover:border-primary"
              to="/customers"
            >
              {translate("customer.form.cancel")}
            </Link>
            <button
              className="rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary transition hover:bg-primary-hover disabled:cursor-wait disabled:opacity-60"
              disabled={formik.isSubmitting}
              type="submit"
            >
              {formik.isSubmitting
                ? translate("customer.form.submitting")
                : translate("customer.form.submit")}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
