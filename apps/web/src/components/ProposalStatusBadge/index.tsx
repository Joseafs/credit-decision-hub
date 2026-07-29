import { useAppPreferences } from "../../contexts/AppPreferencesContext";
import { proposalStatusTranslationKeys } from "../../i18n/proposalLabels";
import type { ProposalStatusBadgeProps } from "./types";

const statusClassNames: Record<ProposalStatusBadgeProps["status"], string> = {
  pending: "bg-surface-subtle text-muted",
  approved: "bg-success-soft text-success",
  rejected: "bg-danger-soft text-danger",
  manual_review: "bg-warning-soft text-warning",
  pending_documents: "bg-warning-soft text-warning",
  fraud_suspected: "bg-danger-soft text-danger",
};

export const ProposalStatusBadge = ({ status }: ProposalStatusBadgeProps) => {
  const { translate } = useAppPreferences();

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassNames[status]}`}
    >
      {translate(proposalStatusTranslationKeys[status])}
    </span>
  );
};
