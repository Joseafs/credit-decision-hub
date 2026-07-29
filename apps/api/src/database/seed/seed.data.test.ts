import {
  createCustomerSchema,
  proposalSchema,
  type ProposalStatus,
} from "@credit-decision-hub/contracts";
import { describe, expect, test } from "vitest";

import { evaluateProposal } from "../../modules/proposals/proposal.rules.js";
import { DEMO_SEED_KEY } from "./seed.config.js";
import {
  createDemoSeedData,
  DEMO_CUSTOMER_COUNT,
  DEMO_PROPOSAL_COUNT,
  type SeedProposal,
} from "./seed.data.js";

const options = {
  randomSeed: 20_260_729,
  referenceDate: new Date("2026-07-29T12:00:00.000Z"),
  seedKey: DEMO_SEED_KEY,
};

const data = createDemoSeedData(options);

const toProposalContract = (proposal: SeedProposal) => ({
  id: proposal._id.toString(),
  customerId: proposal.customerId,
  requestedAmount: proposal.requestedAmount,
  installments: proposal.installments,
  score: proposal.score,
  documentsComplete: proposal.documentsComplete,
  fraudSignals: proposal.fraudSignals,
  estimatedInstallmentAmount: proposal.estimatedInstallmentAmount,
  incomeCommitment: proposal.incomeCommitment,
  riskLevel: proposal.riskLevel,
  status: proposal.status,
  decisionReasonCode: proposal.decisionReasonCode,
  decisionReason: proposal.decisionReason,
  assignedAnalystId: proposal.assignedAnalystId,
  history: proposal.history.map((event) => ({
    id: event._id.toString(),
    actorId: event.actorId,
    actorType: event.actorType,
    createdAt: event.createdAt.toISOString(),
    fromStatus: event.fromStatus,
    reason: event.reason,
    reasonCode: event.reasonCode,
    toStatus: event.toStatus,
  })),
  createdAt: proposal.createdAt.toISOString(),
  updatedAt: proposal.updatedAt.toISOString(),
});

describe("createDemoSeedData", () => {
  test("should create the expected volume using only explicit fictitious identities", () => {
    expect(data.customers).toHaveLength(DEMO_CUSTOMER_COUNT);
    expect(data.proposals).toHaveLength(DEMO_PROPOSAL_COUNT);
    expect(
      data.customers.every(
        (customer) =>
          customer.document.startsWith("FAKE-") &&
          customer.email.endsWith("@example.test") &&
          customer.seedKey === DEMO_SEED_KEY,
      ),
    ).toBe(true);
    expect(
      data.proposals.every(
        (proposal) =>
          proposal.seedKey === DEMO_SEED_KEY &&
          proposal.assignedAnalystId === null,
      ),
    ).toBe(true);
  });

  test("should create balanced final statuses and the five deterministic scenarios", () => {
    const statusCounts = data.proposals.reduce<
      Partial<Record<ProposalStatus, number>>
    >((counts, proposal) => {
      counts[proposal.status] = (counts[proposal.status] ?? 0) + 1;

      return counts;
    }, {});

    expect(statusCounts).toEqual({
      approved: 200,
      rejected: 200,
      manual_review: 200,
      fraud_suspected: 200,
      pending_documents: 200,
    });
    expect(
      data.proposals.slice(0, 5).map(({ _id, status }) => ({
        id: _id.toString(),
        status,
      })),
    ).toEqual([
      { id: "660000000000000000000001", status: "approved" },
      { id: "660000000000000000000002", status: "rejected" },
      { id: "660000000000000000000003", status: "manual_review" },
      { id: "660000000000000000000004", status: "fraud_suspected" },
      { id: "660000000000000000000005", status: "pending_documents" },
    ]);
  });

  test("should distribute proposals inside the twelve-month reference window", () => {
    expect(data.startDate.toISOString()).toBe("2025-07-29T12:00:00.000Z");
    expect(
      data.proposals.every(
        (proposal) =>
          proposal.createdAt >= data.startDate &&
          proposal.createdAt <= data.referenceDate &&
          proposal.history[0]?.createdAt.getTime() ===
            proposal.createdAt.getTime() &&
          proposal.history[1]?.createdAt.getTime() ===
            proposal.updatedAt.getTime(),
      ),
    ).toBe(true);
  });

  test("should keep customers and proposals aligned with shared contracts and decision rules", () => {
    const customersById = new Map(
      data.customers.map((customer) => [customer._id.toString(), customer]),
    );

    data.customers.forEach((customer) => {
      expect(() => createCustomerSchema.parse(customer)).not.toThrow();
    });

    data.proposals.forEach((proposal) => {
      const customer = customersById.get(proposal.customerId);

      expect(customer).toBeDefined();
      if (customer === undefined) {
        return;
      }

      const evaluation = evaluateProposal({
        customerId: proposal.customerId,
        requestedAmount: proposal.requestedAmount,
        installments: proposal.installments,
        score: proposal.score,
        documentsComplete: proposal.documentsComplete,
        fraudSignals: proposal.fraudSignals,
        monthlyIncome: customer.monthlyIncome,
      });

      expect({
        decisionReason: proposal.decisionReason,
        decisionReasonCode: proposal.decisionReasonCode,
        estimatedInstallmentAmount: proposal.estimatedInstallmentAmount,
        incomeCommitment: proposal.incomeCommitment,
        riskLevel: proposal.riskLevel,
        status: proposal.status,
      }).toEqual(evaluation);
      expect(() =>
        proposalSchema.parse(toProposalContract(proposal)),
      ).not.toThrow();
    });
  });

  test("should reproduce the same records with the same seed and reference date", () => {
    const repeatedData = createDemoSeedData(options);

    expect(repeatedData.customers).toEqual(data.customers);
    expect(repeatedData.proposals).toEqual(data.proposals);
  });
});
