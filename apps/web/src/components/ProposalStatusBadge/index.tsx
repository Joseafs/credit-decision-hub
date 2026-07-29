import { StatusBadge, type StatusBadgeProps } from "@credit-decision-hub/ui";

import { useAppPreferences } from "../../contexts/AppPreferencesContext";
import { proposalStatusTranslationKeys } from "../../i18n/proposalLabels";
import type { ProposalStatusBadgeProps } from "./types";

const statusTones: Record<
  ProposalStatusBadgeProps["status"],
  NonNullable<StatusBadgeProps["tone"]>
> = {
  pending: "neutral",
  approved: "success",
  rejected: "danger",
  manual_review: "warning",
  pending_documents: "warning",
  fraud_suspected: "danger",
};

export const ProposalStatusBadge = ({ status }: ProposalStatusBadgeProps) => {
  const { translate } = useAppPreferences();

  return (
    <StatusBadge tone={statusTones[status]}>
      {translate(proposalStatusTranslationKeys[status])}
    </StatusBadge>
  );
};
