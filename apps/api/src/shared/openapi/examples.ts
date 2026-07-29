import type {
  ApiErrorResponse,
  CreateCustomerInput,
  CreateProposalInput,
  Customer,
  CustomerListResponse,
  Proposal,
  ProposalListResponse,
  ValidationErrorResponse,
} from "@credit-decision-hub/contracts";

const occurredAt = "2026-07-29T17:00:00.000Z";

export const customerInputExample: CreateCustomerInput = {
  name: "Marina Costa",
  document: "FAKE-000001",
  email: "marina.costa@example.test",
  phone: "11999990001",
  monthlyIncome: 8_500,
  occupation: "Analista de dados",
};

export const customerExample: Customer = {
  id: "650000000000000000000001",
  ...customerInputExample,
  createdAt: occurredAt,
};

export const customerListExample: CustomerListResponse = {
  data: [customerExample],
  pagination: {
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1,
  },
};

export const proposalInputExample: CreateProposalInput = {
  customerId: customerExample.id,
  requestedAmount: 60_000,
  installments: 24,
  score: 750,
  documentsComplete: true,
  fraudSignals: [],
};

export const proposalExample: Proposal = {
  id: "660000000000000000000001",
  ...proposalInputExample,
  estimatedInstallmentAmount: 2_500,
  incomeCommitment: 29.41,
  riskLevel: "low",
  status: "approved",
  decisionReasonCode: "eligible",
  decisionReason: "Critérios automáticos atendidos",
  assignedAnalystId: null,
  history: [
    {
      id: "670000000000000000000001",
      fromStatus: null,
      toStatus: "pending",
      reasonCode: "proposal_created",
      reason: "Proposta criada",
      actorType: "system",
      actorId: null,
      createdAt: occurredAt,
    },
    {
      id: "670000000000000000000002",
      fromStatus: "pending",
      toStatus: "approved",
      reasonCode: "eligible",
      reason: "Critérios automáticos atendidos",
      actorType: "system",
      actorId: null,
      createdAt: occurredAt,
    },
  ],
  createdAt: occurredAt,
  updatedAt: occurredAt,
};

export const proposalListExample: ProposalListResponse = {
  data: [proposalExample],
  pagination: {
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1,
  },
};

export const validationErrorExample: ValidationErrorResponse = {
  message: "Dados inválidos",
  issues: [
    {
      path: "monthlyIncome",
      message: "Too small: expected number to be >=0",
    },
  ],
};

export const customerNotFoundExample: ApiErrorResponse = {
  message: "Cliente não encontrado",
};

export const proposalNotFoundExample: ApiErrorResponse = {
  message: "Proposta não encontrada",
};

export const customerConflictExample: ApiErrorResponse = {
  message: "Já existe um cliente com este documento ou e-mail",
};
