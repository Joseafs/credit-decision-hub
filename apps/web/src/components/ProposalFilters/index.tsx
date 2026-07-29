import {
  listProposalsQuerySchema,
  proposalRiskLevelValues,
  proposalStatusValues,
} from "@credit-decision-hub/contracts";
import { Button } from "@credit-decision-hub/ui";
import { useEffect, useState, type FormEvent } from "react";

import { useAppPreferences } from "../../contexts/AppPreferencesContext";
import {
  proposalRiskTranslationKeys,
  proposalStatusTranslationKeys,
} from "../../i18n/proposalLabels";
import type { ProposalFiltersProps, ProposalFilterValues } from "./types";

const toDateInput = (value?: string) => value?.slice(0, 10) ?? "";
const toStartOfDay = (value: string) =>
  value ? `${value}T00:00:00.000Z` : undefined;
const toEndOfDay = (value: string) =>
  value ? `${value}T23:59:59.999Z` : undefined;

const getInitialValues = (
  query: ProposalFiltersProps["query"],
): ProposalFilterValues => ({
  status: query.status ?? "",
  riskLevel: query.riskLevel ?? "",
  createdFrom: toDateInput(query.createdFrom),
  createdTo: toDateInput(query.createdTo),
  minRequestedAmount: query.minRequestedAmount?.toString() ?? "",
  maxRequestedAmount: query.maxRequestedAmount?.toString() ?? "",
});

const optionalNumber = (value: string) =>
  value === "" ? undefined : Number(value);

export const ProposalFilters = ({
  query,
  onApply,
  onClear,
}: ProposalFiltersProps) => {
  const { translate } = useAppPreferences();
  const [values, setValues] = useState(() => getInitialValues(query));
  const [hasValidationError, setHasValidationError] = useState(false);

  useEffect(() => {
    setValues(getInitialValues(query));
    setHasValidationError(false);
  }, [query]);

  const updateField = (field: keyof ProposalFilterValues, value: string) => {
    setValues((currentValues) => ({ ...currentValues, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = listProposalsQuerySchema.safeParse({
      page: 1,
      limit: query.limit,
      status: values.status || undefined,
      riskLevel: values.riskLevel || undefined,
      createdFrom: toStartOfDay(values.createdFrom),
      createdTo: toEndOfDay(values.createdTo),
      minRequestedAmount: optionalNumber(values.minRequestedAmount),
      maxRequestedAmount: optionalNumber(values.maxRequestedAmount),
    });

    if (!result.success) {
      setHasValidationError(true);
      return;
    }

    setHasValidationError(false);
    onApply(result.data);
  };

  const inputClassName =
    "mt-2 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-heading outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <form
      className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-semibold text-heading">
            {translate("proposals.filters.title")}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {translate("proposals.filters.description")}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm font-medium text-heading">
          {translate("proposals.filters.status")}
          <select
            className={inputClassName}
            onChange={(event) => updateField("status", event.target.value)}
            value={values.status}
          >
            <option value="">{translate("proposals.filters.all")}</option>
            {proposalStatusValues.map((status) => (
              <option key={status} value={status}>
                {translate(proposalStatusTranslationKeys[status])}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-heading">
          {translate("proposals.filters.risk")}
          <select
            className={inputClassName}
            onChange={(event) => updateField("riskLevel", event.target.value)}
            value={values.riskLevel}
          >
            <option value="">{translate("proposals.filters.all")}</option>
            {proposalRiskLevelValues.map((riskLevel) => (
              <option key={riskLevel} value={riskLevel}>
                {translate(proposalRiskTranslationKeys[riskLevel])}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-heading">
          {translate("proposals.filters.createdFrom")}
          <input
            className={inputClassName}
            onChange={(event) => updateField("createdFrom", event.target.value)}
            type="date"
            value={values.createdFrom}
          />
        </label>

        <label className="text-sm font-medium text-heading">
          {translate("proposals.filters.createdTo")}
          <input
            className={inputClassName}
            onChange={(event) => updateField("createdTo", event.target.value)}
            type="date"
            value={values.createdTo}
          />
        </label>

        <label className="text-sm font-medium text-heading">
          {translate("proposals.filters.minAmount")}
          <input
            className={inputClassName}
            min="0"
            onChange={(event) =>
              updateField("minRequestedAmount", event.target.value)
            }
            step="0.01"
            type="number"
            value={values.minRequestedAmount}
          />
        </label>

        <label className="text-sm font-medium text-heading">
          {translate("proposals.filters.maxAmount")}
          <input
            className={inputClassName}
            min="0"
            onChange={(event) =>
              updateField("maxRequestedAmount", event.target.value)
            }
            step="0.01"
            type="number"
            value={values.maxRequestedAmount}
          />
        </label>
      </div>

      {hasValidationError && (
        <p className="mt-4 text-sm font-medium text-danger" role="alert">
          {translate("proposals.filters.invalid")}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <Button type="submit">{translate("proposals.filters.apply")}</Button>
        <Button onClick={onClear} type="button" variant="secondary">
          {translate("proposals.filters.clear")}
        </Button>
      </div>
    </form>
  );
};
