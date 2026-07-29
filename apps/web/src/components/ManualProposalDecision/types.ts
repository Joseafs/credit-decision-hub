import type { Proposal } from "@credit-decision-hub/contracts";

export type ManualProposalDecisionProps = {
  proposal: Proposal;
  onDecided: (proposal: Proposal) => void;
};
