import {
  proposalDecisionReasonCodeValues,
  proposalFraudSignalValues,
  proposalHistoryActorTypeValues,
  proposalRiskLevelValues,
  proposalStatusValues,
} from "@credit-decision-hub/contracts";
import { type InferSchemaType, model, Schema } from "mongoose";

const proposalHistoryModelSchema = new Schema(
  {
    fromStatus: {
      type: String,
      enum: proposalStatusValues,
      default: null,
    },
    toStatus: {
      type: String,
      enum: proposalStatusValues,
      required: true,
    },
    reasonCode: {
      type: String,
      enum: proposalDecisionReasonCodeValues,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 240,
    },
    actorType: {
      type: String,
      enum: proposalHistoryActorTypeValues,
      required: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdAt: {
      type: Date,
      required: true,
      immutable: true,
    },
  },
  {
    id: false,
    versionKey: false,
  },
);

const proposalModelSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    requestedAmount: {
      type: Number,
      required: true,
      min: Number.MIN_VALUE,
      immutable: true,
    },
    installments: {
      type: Number,
      required: true,
      min: 1,
      max: 60,
      immutable: true,
      validate: {
        validator: Number.isInteger,
        message: "A quantidade de parcelas deve ser inteira",
      },
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 1000,
      immutable: true,
      validate: {
        validator: Number.isInteger,
        message: "O score deve ser inteiro",
      },
    },
    documentsComplete: {
      type: Boolean,
      required: true,
    },
    fraudSignals: {
      type: [
        {
          type: String,
          enum: proposalFraudSignalValues,
        },
      ],
      default: [],
      validate: {
        validator: (signals: string[]) =>
          new Set(signals).size === signals.length,
        message: "Indícios de fraude não podem ser duplicados",
      },
    },
    estimatedInstallmentAmount: {
      type: Number,
      required: true,
      min: Number.MIN_VALUE,
    },
    incomeCommitment: {
      type: Number,
      min: 0,
      default: null,
    },
    riskLevel: {
      type: String,
      enum: proposalRiskLevelValues,
      required: true,
    },
    status: {
      type: String,
      enum: proposalStatusValues,
      required: true,
    },
    decisionReasonCode: {
      type: String,
      enum: proposalDecisionReasonCodeValues,
      required: true,
    },
    decisionReason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 240,
    },
    assignedAnalystId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    history: {
      type: [proposalHistoryModelSchema],
      required: true,
      validate: {
        validator: (history: unknown[]) => history.length > 0,
        message: "A proposta deve possuir histórico",
      },
    },
    seedKey: {
      type: String,
      default: null,
      select: false,
      index: true,
    },
  },
  {
    collection: "proposals",
    timestamps: true,
    versionKey: false,
  },
);

proposalModelSchema.index({ customerId: 1, createdAt: -1 });
proposalModelSchema.index({ status: 1, createdAt: -1 });
proposalModelSchema.index({ riskLevel: 1, createdAt: -1 });
proposalModelSchema.index({ requestedAmount: 1 });

export type ProposalPersistence = InferSchemaType<typeof proposalModelSchema>;

export const ProposalModel = model<ProposalPersistence>(
  "Proposal",
  proposalModelSchema,
);
