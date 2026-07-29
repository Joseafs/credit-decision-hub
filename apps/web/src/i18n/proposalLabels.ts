import type {
  ProposalDecisionReasonCode,
  ProposalFraudSignal,
  ProposalHistoryActorType,
  ProposalRiskLevel,
  ProposalStatus,
} from "@credit-decision-hub/contracts";

import type { TranslationKey } from "./translations";

export const proposalStatusTranslationKeys: Record<
  ProposalStatus,
  TranslationKey
> = {
  pending: "proposal.status.pending",
  approved: "proposal.status.approved",
  rejected: "proposal.status.rejected",
  manual_review: "proposal.status.manualReview",
  pending_documents: "proposal.status.pendingDocuments",
  fraud_suspected: "proposal.status.fraudSuspected",
};

export const proposalRiskTranslationKeys: Record<
  ProposalRiskLevel,
  TranslationKey
> = {
  low: "proposal.risk.low",
  medium: "proposal.risk.medium",
  high: "proposal.risk.high",
};

export const proposalReasonTranslationKeys: Record<
  ProposalDecisionReasonCode,
  TranslationKey
> = {
  proposal_created: "proposal.reason.created",
  fraud_signal_detected: "proposal.reason.fraudSignal",
  documents_incomplete: "proposal.reason.documentsIncomplete",
  income_unavailable: "proposal.reason.incomeUnavailable",
  high_risk: "proposal.reason.highRisk",
  high_amount: "proposal.reason.highAmount",
  medium_risk: "proposal.reason.mediumRisk",
  eligible: "proposal.reason.eligible",
};

export const proposalFraudSignalTranslationKeys: Record<
  ProposalFraudSignal,
  TranslationKey
> = {
  document_mismatch: "proposal.fraud.documentMismatch",
  identity_mismatch: "proposal.fraud.identityMismatch",
  duplicate_application: "proposal.fraud.duplicateApplication",
};

export const proposalActorTranslationKeys: Record<
  ProposalHistoryActorType,
  TranslationKey
> = {
  system: "proposal.actor.system",
  analyst: "proposal.actor.analyst",
};
