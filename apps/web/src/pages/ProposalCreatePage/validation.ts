import {
  createProposalSchema,
  type CreateProposalInput,
} from "@credit-decision-hub/contracts";
import type { FormikErrors } from "formik";

import type { ProposalFormValues } from "./types";

const toContractInput = (values: ProposalFormValues) => ({
  ...values,
  requestedAmount:
    values.requestedAmount.trim() === ""
      ? Number.NaN
      : Number(values.requestedAmount),
  installments:
    values.installments.trim() === ""
      ? Number.NaN
      : Number(values.installments),
  score: values.score.trim() === "" ? Number.NaN : Number(values.score),
});

export const parseProposalForm = (
  values: ProposalFormValues,
): CreateProposalInput => createProposalSchema.parse(toContractInput(values));

export const validateProposalForm = (
  values: ProposalFormValues,
  invalidMessage: string,
): FormikErrors<ProposalFormValues> => {
  const result = createProposalSchema.safeParse(toContractInput(values));

  if (result.success) {
    return {};
  }

  return result.error.issues.reduce<FormikErrors<ProposalFormValues>>(
    (errors, issue) => {
      const field = issue.path[0];

      if (typeof field === "string" && field in values) {
        const formField = field as keyof ProposalFormValues;

        if (!errors[formField]) {
          errors[formField] = invalidMessage;
        }
      }

      return errors;
    },
    {},
  );
};
