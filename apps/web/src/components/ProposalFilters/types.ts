import type { ListProposalsQuery } from "@credit-decision-hub/contracts";

export type ProposalFiltersProps = {
  query: ListProposalsQuery;
  onApply: (query: ListProposalsQuery) => void;
  onClear: () => void;
};

export type ProposalFilterValues = {
  status: string;
  riskLevel: string;
  createdFrom: string;
  createdTo: string;
  minRequestedAmount: string;
  maxRequestedAmount: string;
};
