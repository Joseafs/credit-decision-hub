import {
  createCustomerSchema,
  type CreateCustomerInput,
} from "@credit-decision-hub/contracts";
import type { FormikErrors } from "formik";

import type { CustomerFormValues } from "./types";

export const parseCustomerForm = (
  values: CustomerFormValues,
): CreateCustomerInput =>
  createCustomerSchema.parse({
    ...values,
    monthlyIncome:
      values.monthlyIncome.trim() === ""
        ? Number.NaN
        : Number(values.monthlyIncome),
  });

export const validateCustomerForm = (
  values: CustomerFormValues,
  invalidMessage: string,
): FormikErrors<CustomerFormValues> => {
  const result = createCustomerSchema.safeParse({
    ...values,
    monthlyIncome:
      values.monthlyIncome.trim() === ""
        ? Number.NaN
        : Number(values.monthlyIncome),
  });

  if (result.success) {
    return {};
  }

  return result.error.issues.reduce<FormikErrors<CustomerFormValues>>(
    (errors, issue) => {
      const field = issue.path[0];

      if (typeof field === "string" && field in values) {
        const formField = field as keyof CustomerFormValues;

        if (!errors[formField]) {
          errors[formField] = invalidMessage;
        }
      }

      return errors;
    },
    {},
  );
};
