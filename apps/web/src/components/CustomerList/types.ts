import type { Customer } from "@credit-decision-hub/contracts";

import type { AppLocale } from "../../contexts/AppPreferencesContext/types";

export type CustomerListProps = {
  customers: Customer[];
  locale: AppLocale;
};
