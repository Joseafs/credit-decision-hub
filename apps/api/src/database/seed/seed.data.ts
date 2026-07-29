import {
  createCustomerSchema,
  createProposalSchema,
  type CreateCustomerInput,
  type CreateProposalInput,
  type ProposalDecisionReasonCode,
  type ProposalFraudSignal,
  type ProposalRiskLevel,
  type ProposalStatus,
} from "@credit-decision-hub/contracts";
import { base, en, Faker, pt_BR } from "@faker-js/faker";
import { Types } from "mongoose";

import {
  evaluateProposal,
  proposalDecisionReasonMessages,
} from "../../modules/proposals/proposal.rules.js";

export const DEMO_CUSTOMER_COUNT = 500;
export const DEMO_PROPOSAL_COUNT = 1_000;

const MILLISECONDS_PER_DAY = 86_400_000;

const scenarioNames = [
  "Cliente Demo Aprovado",
  "Cliente Demo Reprovado",
  "Cliente Demo Análise Manual",
  "Cliente Demo Suspeita de Fraude",
  "Cliente Demo Documentos Pendentes",
] as const;

type SeedHistoryEvent = {
  _id: Types.ObjectId;
  actorId: null;
  actorType: "system";
  createdAt: Date;
  fromStatus: ProposalStatus | null;
  reason: string;
  reasonCode: ProposalDecisionReasonCode;
  toStatus: ProposalStatus;
};

export type SeedCustomer = CreateCustomerInput & {
  _id: Types.ObjectId;
  createdAt: Date;
  seedKey: string;
};

export type SeedProposal = CreateProposalInput & {
  _id: Types.ObjectId;
  assignedAnalystId: null;
  createdAt: Date;
  decisionReason: string;
  decisionReasonCode: ProposalDecisionReasonCode;
  estimatedInstallmentAmount: number;
  history: SeedHistoryEvent[];
  incomeCommitment: number | null;
  riskLevel: ProposalRiskLevel;
  seedKey: string;
  status: ProposalStatus;
  updatedAt: Date;
};

export type DemoSeedData = {
  customers: SeedCustomer[];
  proposals: SeedProposal[];
  referenceDate: Date;
  startDate: Date;
};

export type DemoSeedOptions = {
  randomSeed: number;
  referenceDate: Date;
  seedKey: string;
};

const createObjectId = (namespace: string, index: number): Types.ObjectId =>
  new Types.ObjectId(`${namespace}${index.toString(16).padStart(18, "0")}`);

const roundToTwoDecimalPlaces = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const subtractOneYear = (date: Date): Date => {
  const result = new Date(date);

  result.setUTCFullYear(result.getUTCFullYear() - 1);

  return result;
};

const createCustomer = (
  faker: Faker,
  index: number,
  customerCreatedAt: Date,
  seedKey: string,
): SeedCustomer => {
  const scenarioName = scenarioNames[index];
  const input = createCustomerSchema.parse({
    name: scenarioName ?? faker.person.fullName(),
    document: `FAKE-${(index + 1).toString().padStart(6, "0")}`,
    email: `cliente${(index + 1).toString().padStart(4, "0")}@example.test`,
    phone: `119${(10_000_000 + index).toString()}`,
    monthlyIncome: faker.number.float({
      fractionDigits: 2,
      max: 50_000,
      min: 3_000,
    }),
    occupation: faker.person.jobTitle().slice(0, 100),
  });

  return {
    _id: createObjectId("650000", index + 1),
    ...input,
    createdAt: customerCreatedAt,
    seedKey,
  };
};

type ProposalScenario = Pick<
  CreateProposalInput,
  "documentsComplete" | "fraudSignals" | "score"
> & {
  commitmentPercentage: number;
};

const createProposalScenario = (
  faker: Faker,
  index: number,
): ProposalScenario => {
  const scenarioIndex = index % scenarioNames.length;
  const commitmentPercentage = faker.number.float({
    fractionDigits: 2,
    max: 25,
    min: 5,
  });

  if (scenarioIndex === 0) {
    return {
      commitmentPercentage,
      documentsComplete: true,
      fraudSignals: [],
      score: faker.number.int({ max: 1_000, min: 700 }),
    };
  }

  if (scenarioIndex === 1) {
    return {
      commitmentPercentage,
      documentsComplete: true,
      fraudSignals: [],
      score: faker.number.int({ max: 499, min: 0 }),
    };
  }

  if (scenarioIndex === 2) {
    return {
      commitmentPercentage,
      documentsComplete: true,
      fraudSignals: [],
      score: faker.number.int({ max: 699, min: 500 }),
    };
  }

  if (scenarioIndex === 3) {
    return {
      commitmentPercentage,
      documentsComplete: true,
      fraudSignals: [
        faker.helpers.arrayElement<ProposalFraudSignal>([
          "document_mismatch",
          "identity_mismatch",
          "duplicate_application",
        ]),
      ],
      score: faker.number.int({ max: 1_000, min: 700 }),
    };
  }

  return {
    commitmentPercentage,
    documentsComplete: false,
    fraudSignals: [],
    score: faker.number.int({ max: 1_000, min: 700 }),
  };
};

const createProposal = (
  faker: Faker,
  customers: SeedCustomer[],
  index: number,
  proposalCreatedAt: Date,
  seedKey: string,
): SeedProposal => {
  const customer = customers[index % customers.length];

  if (customer === undefined) {
    throw new Error("Cliente do seed não encontrado");
  }

  const installments = faker.number.int({ max: 60, min: 6 });
  const scenario = createProposalScenario(faker, index);
  const requestedAmount = roundToTwoDecimalPlaces(
    Math.min(
      (customer.monthlyIncome * scenario.commitmentPercentage * installments) /
        100,
      100_000,
    ),
  );
  const input = createProposalSchema.parse({
    customerId: customer._id.toString(),
    requestedAmount,
    installments,
    score: scenario.score,
    documentsComplete: scenario.documentsComplete,
    fraudSignals: scenario.fraudSignals,
  });
  const evaluation = evaluateProposal({
    ...input,
    monthlyIncome: customer.monthlyIncome,
  });
  const decisionCreatedAt = new Date(proposalCreatedAt.getTime() + 1_000);
  const historyIndex = index * 2;

  return {
    _id: createObjectId("660000", index + 1),
    ...input,
    ...evaluation,
    assignedAnalystId: null,
    history: [
      {
        _id: createObjectId("670000", historyIndex + 1),
        actorId: null,
        actorType: "system",
        createdAt: proposalCreatedAt,
        fromStatus: null,
        reason: proposalDecisionReasonMessages.proposal_created,
        reasonCode: "proposal_created",
        toStatus: "pending",
      },
      {
        _id: createObjectId("670000", historyIndex + 2),
        actorId: null,
        actorType: "system",
        createdAt: decisionCreatedAt,
        fromStatus: "pending",
        reason: evaluation.decisionReason,
        reasonCode: evaluation.decisionReasonCode,
        toStatus: evaluation.status,
      },
    ],
    createdAt: proposalCreatedAt,
    seedKey,
    updatedAt: decisionCreatedAt,
  };
};

export const createDemoSeedData = ({
  randomSeed,
  referenceDate,
  seedKey,
}: DemoSeedOptions): DemoSeedData => {
  const faker = new Faker({ locale: [pt_BR, en, base] });

  faker.seed(randomSeed);

  const startDate = subtractOneYear(referenceDate);
  const latestProposalDate = new Date(referenceDate.getTime() - 1_000);
  const customerCreatedAt = new Date(
    startDate.getTime() - 30 * MILLISECONDS_PER_DAY,
  );
  const customers = Array.from({ length: DEMO_CUSTOMER_COUNT }, (_, index) =>
    createCustomer(faker, index, customerCreatedAt, seedKey),
  );
  const proposals = Array.from({ length: DEMO_PROPOSAL_COUNT }, (_, index) =>
    createProposal(
      faker,
      customers,
      index,
      faker.date.between({ from: startDate, to: latestProposalDate }),
      seedKey,
    ),
  );

  return {
    customers,
    proposals,
    referenceDate,
    startDate,
  };
};
