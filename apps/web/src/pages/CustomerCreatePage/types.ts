import type { CreateCustomerInput } from "@credit-decision-hub/contracts";

export type CustomerFormValues = Omit<CreateCustomerInput, "monthlyIncome"> & {
  monthlyIncome: string;
};
