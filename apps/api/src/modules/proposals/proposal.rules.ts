import type {
  CreateProposalInput,
  Proposal,
  ProposalDecisionReasonCode,
  ProposalRiskLevel,
  ProposalStatus,
} from "@credit-decision-hub/contracts";

type ProposalEvaluationInput = CreateProposalInput & {
  monthlyIncome: number;
};

export type ProposalEvaluation = Pick<
  Proposal,
  | "estimatedInstallmentAmount"
  | "incomeCommitment"
  | "riskLevel"
  | "status"
  | "decisionReasonCode"
  | "decisionReason"
>;

type AutomaticProposalStatus = Exclude<ProposalStatus, "pending">;
type AutomaticDecisionReasonCode = Exclude<
  ProposalDecisionReasonCode,
  "proposal_created"
>;

type ProposalDecision = Pick<
  ProposalEvaluation,
  "status" | "decisionReasonCode" | "decisionReason"
> & {
  status: AutomaticProposalStatus;
  decisionReasonCode: AutomaticDecisionReasonCode;
};

const riskPriority: Record<ProposalRiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

export const proposalDecisionReasonMessages: Record<
  ProposalDecisionReasonCode,
  string
> = {
  proposal_created: "Proposta criada",
  fraud_signal_detected: "Foram identificados indícios de fraude",
  documents_incomplete: "Documentação incompleta",
  income_unavailable: "Renda mensal indisponível para análise",
  high_risk: "Proposta classificada como alto risco",
  high_amount: "Valor solicitado exige análise manual",
  medium_risk: "Proposta classificada como risco médio",
  eligible: "Critérios automáticos atendidos",
  manual_approval: "Proposta aprovada manualmente",
  manual_rejection: "Proposta reprovada manualmente",
  manual_review_requested: "Proposta encaminhada para análise manual",
};

const roundToTwoDecimalPlaces = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const calculateEstimatedInstallment = (
  requestedAmount: number,
  installments: number,
): number => roundToTwoDecimalPlaces(requestedAmount / installments);

export const calculateIncomeCommitment = (
  estimatedInstallmentAmount: number,
  monthlyIncome: number,
): number | null =>
  monthlyIncome <= 0
    ? null
    : roundToTwoDecimalPlaces(
        (estimatedInstallmentAmount / monthlyIncome) * 100,
      );

const classifyScoreRisk = (score: number): ProposalRiskLevel => {
  if (score < 500) {
    return "high";
  }

  if (score < 700) {
    return "medium";
  }

  return "low";
};

const classifyIncomeRisk = (
  incomeCommitment: number | null,
): ProposalRiskLevel => {
  if (incomeCommitment === null || incomeCommitment > 40) {
    return "high";
  }

  if (incomeCommitment > 30) {
    return "medium";
  }

  return "low";
};

export const classifyProposalRisk = (
  score: number,
  incomeCommitment: number | null,
): ProposalRiskLevel => {
  const scoreRisk = classifyScoreRisk(score);
  const incomeRisk = classifyIncomeRisk(incomeCommitment);

  return riskPriority[scoreRisk] >= riskPriority[incomeRisk]
    ? scoreRisk
    : incomeRisk;
};

const createDecision = (
  status: AutomaticProposalStatus,
  decisionReasonCode: AutomaticDecisionReasonCode,
): ProposalDecision => ({
  status,
  decisionReasonCode,
  decisionReason: proposalDecisionReasonMessages[decisionReasonCode],
});

const decideProposal = (
  input: ProposalEvaluationInput,
  riskLevel: ProposalRiskLevel,
): ProposalDecision => {
  if (input.fraudSignals.length > 0) {
    return createDecision("fraud_suspected", "fraud_signal_detected");
  }

  if (!input.documentsComplete) {
    return createDecision("pending_documents", "documents_incomplete");
  }

  if (input.monthlyIncome <= 0) {
    return createDecision("rejected", "income_unavailable");
  }

  if (riskLevel === "high") {
    return createDecision("rejected", "high_risk");
  }

  if (input.requestedAmount > 100_000) {
    return createDecision("manual_review", "high_amount");
  }

  if (riskLevel === "medium") {
    return createDecision("manual_review", "medium_risk");
  }

  return createDecision("approved", "eligible");
};

export const evaluateProposal = (
  input: ProposalEvaluationInput,
): ProposalEvaluation => {
  const estimatedInstallmentAmount = calculateEstimatedInstallment(
    input.requestedAmount,
    input.installments,
  );
  const incomeCommitment = calculateIncomeCommitment(
    estimatedInstallmentAmount,
    input.monthlyIncome,
  );
  const riskLevel = classifyProposalRisk(input.score, incomeCommitment);

  return {
    estimatedInstallmentAmount,
    incomeCommitment,
    riskLevel,
    ...decideProposal(input, riskLevel),
  };
};
