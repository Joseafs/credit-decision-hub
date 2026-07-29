import type { Customer, Proposal } from "@credit-decision-hub/contracts";

export const customerFixture: Customer = {
  id: "650000000000000000000001",
  name: "Marina Costa",
  document: "FAKE-000001",
  email: "marina.costa@example.test",
  phone: "+55 11 90000-0000",
  monthlyIncome: 8_500,
  occupation: "Analista de sistemas",
  createdAt: "2026-07-29T12:00:00.000Z",
};

export const proposalFixture: Proposal = {
  id: "660000000000000000000001",
  customerId: customerFixture.id,
  requestedAmount: 60_000,
  installments: 24,
  score: 750,
  documentsComplete: true,
  fraudSignals: [],
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
      createdAt: "2026-07-29T12:00:00.000Z",
    },
    {
      id: "670000000000000000000002",
      fromStatus: "pending",
      toStatus: "approved",
      reasonCode: "eligible",
      reason: "Critérios automáticos atendidos",
      actorType: "system",
      actorId: null,
      createdAt: "2026-07-29T12:00:01.000Z",
    },
  ],
  createdAt: "2026-07-29T12:00:00.000Z",
  updatedAt: "2026-07-29T12:00:01.000Z",
};
