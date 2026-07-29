import type { Proposal } from "@credit-decision-hub/contracts";

import type { AppLocale } from "../../contexts/AppPreferencesContext/types";

export type ProposalListProps = {
  locale: AppLocale;
  proposals: Proposal[];
};
