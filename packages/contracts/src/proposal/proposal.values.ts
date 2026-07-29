export const proposalStatusValues = [
  "pending",
  "approved",
  "rejected",
  "manual_review",
  "pending_documents",
  "fraud_suspected",
] as const;

export const proposalRiskLevelValues = ["low", "medium", "high"] as const;

export const proposalFraudSignalValues = [
  "document_mismatch",
  "identity_mismatch",
  "duplicate_application",
] as const;

export const proposalDecisionReasonCodeValues = [
  "proposal_created",
  "fraud_signal_detected",
  "documents_incomplete",
  "income_unavailable",
  "high_risk",
  "high_amount",
  "medium_risk",
  "eligible",
] as const;

export const proposalHistoryActorTypeValues = ["system", "analyst"] as const;
