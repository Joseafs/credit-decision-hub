import { z } from "zod";

import { entityIdSchema } from "../shared/entity.schema.js";
import {
  proposalDecisionReasonCodeValues,
  proposalHistoryActorTypeValues,
  proposalStatusValues,
} from "./proposal.values.js";

export const proposalStatusSchema = z.enum(proposalStatusValues);

export const proposalDecisionReasonCodeSchema = z.enum(
  proposalDecisionReasonCodeValues,
);

export const proposalHistoryActorTypeSchema = z.enum(
  proposalHistoryActorTypeValues,
);

const proposalHistoryFields = {
  id: entityIdSchema,
  fromStatus: proposalStatusSchema.nullable(),
  toStatus: proposalStatusSchema,
  reasonCode: proposalDecisionReasonCodeSchema,
  reason: z.string().trim().min(1).max(240),
  createdAt: z.iso.datetime(),
};

export const proposalHistorySchema = z
  .discriminatedUnion("actorType", [
    z
      .object({
        ...proposalHistoryFields,
        actorType: z.literal("system"),
        actorId: z.null(),
      })
      .strict(),
    z
      .object({
        ...proposalHistoryFields,
        actorType: z.literal("analyst"),
        actorId: entityIdSchema,
      })
      .strict(),
  ])
  .superRefine((event, context) => {
    const isCreation = event.reasonCode === "proposal_created";

    if (isCreation && event.fromStatus !== null) {
      context.addIssue({
        code: "custom",
        message: "O evento de criação não possui status anterior",
        path: ["fromStatus"],
      });
    }

    if (isCreation && event.toStatus !== "pending") {
      context.addIssue({
        code: "custom",
        message: "O evento de criação deve iniciar como pending",
        path: ["toStatus"],
      });
    }

    if (isCreation && event.actorType !== "system") {
      context.addIssue({
        code: "custom",
        message: "O evento de criação deve ser registrado pelo sistema",
        path: ["actorType"],
      });
    }

    if (!isCreation && event.fromStatus === null) {
      context.addIssue({
        code: "custom",
        message: "Uma transição deve informar o status anterior",
        path: ["fromStatus"],
      });
    }
  });

export type ProposalStatus = z.infer<typeof proposalStatusSchema>;
export type ProposalDecisionReasonCode = z.infer<
  typeof proposalDecisionReasonCodeSchema
>;
export type ProposalHistoryActorType = z.infer<
  typeof proposalHistoryActorTypeSchema
>;
export type ProposalHistory = z.infer<typeof proposalHistorySchema>;
