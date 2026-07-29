import {
  auditEventSchema,
  dashboardSummarySchema,
  proposalRiskLevelValues,
  proposalStatusValues,
  type AuditEvent,
  type DashboardSummary,
  type ListAuditEventsQuery,
  type ProposalRiskLevel,
  type ProposalStatus,
} from "@credit-decision-hub/contracts";
import { Types } from "mongoose";

import { ProposalModel } from "../proposals/proposal.model.js";

type DistributionRow<Value> = {
  _id: Value;
  count: number;
};

type SummaryAggregation = {
  totals: Array<{
    totalProposals: number;
    totalRequestedAmount: number;
    approvedCount: number;
    pendingActionCount: number;
    manualDecisionCount: number;
    myDecisionCount: number;
  }>;
  statuses: Array<DistributionRow<ProposalStatus>>;
  risks: Array<DistributionRow<ProposalRiskLevel>>;
};

type AuditAggregation = {
  data: Array<{
    _id: Types.ObjectId;
    proposalId: Types.ObjectId;
    actorId: Types.ObjectId;
    actorName: string | null;
    fromStatus: ProposalStatus;
    toStatus: ProposalStatus;
    reasonCode: AuditEvent["reasonCode"];
    reason: string;
    createdAt: Date;
  }>;
  metadata: Array<{ total: number }>;
};

type AuditPage = {
  data: AuditEvent[];
  total: number;
};

export type DashboardRepository = {
  getSummary(actorId: string): Promise<DashboardSummary>;
  findAuditPage(query: ListAuditEventsQuery): Promise<AuditPage>;
};

const countByValue = <Value extends string>(
  values: readonly Value[],
  rows: Array<DistributionRow<Value>>,
): Array<{ count: number; value: Value }> =>
  values.map((value) => ({
    value,
    count: rows.find((row) => row._id === value)?.count ?? 0,
  }));

export const dashboardRepository: DashboardRepository = {
  async getSummary(actorId) {
    const [aggregation] = await ProposalModel.aggregate<SummaryAggregation>([
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalProposals: { $sum: 1 },
                totalRequestedAmount: { $sum: "$requestedAmount" },
                approvedCount: {
                  $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
                },
                pendingActionCount: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          "$status",
                          [
                            "manual_review",
                            "fraud_suspected",
                            "pending_documents",
                          ],
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                manualDecisionCount: {
                  $sum: {
                    $size: {
                      $filter: {
                        input: "$history",
                        as: "event",
                        cond: { $eq: ["$$event.actorType", "analyst"] },
                      },
                    },
                  },
                },
                myDecisionCount: {
                  $sum: {
                    $size: {
                      $filter: {
                        input: "$history",
                        as: "event",
                        cond: {
                          $and: [
                            { $eq: ["$$event.actorType", "analyst"] },
                            {
                              $eq: [
                                "$$event.actorId",
                                new Types.ObjectId(actorId),
                              ],
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          ],
          statuses: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
          risks: [{ $group: { _id: "$riskLevel", count: { $sum: 1 } } }],
        },
      },
    ]).exec();

    const totals = aggregation?.totals[0] ?? {
      totalProposals: 0,
      totalRequestedAmount: 0,
      approvedCount: 0,
      pendingActionCount: 0,
      manualDecisionCount: 0,
      myDecisionCount: 0,
    };

    return dashboardSummarySchema.parse({
      totalProposals: totals.totalProposals,
      totalRequestedAmount: totals.totalRequestedAmount,
      approvalRate:
        totals.totalProposals === 0
          ? 0
          : Math.round(
              (totals.approvedCount / totals.totalProposals) * 10_000,
            ) / 100,
      pendingActionCount: totals.pendingActionCount,
      manualDecisionCount: totals.manualDecisionCount,
      myDecisionCount: totals.myDecisionCount,
      statusDistribution: countByValue(
        proposalStatusValues,
        aggregation?.statuses ?? [],
      ).map(({ value, count }) => ({ status: value, count })),
      riskDistribution: countByValue(
        proposalRiskLevelValues,
        aggregation?.risks ?? [],
      ).map(({ value, count }) => ({ riskLevel: value, count })),
    });
  },

  async findAuditPage(query) {
    const skip = (query.page - 1) * query.limit;
    const [aggregation] = await ProposalModel.aggregate<AuditAggregation>([
      { $unwind: "$history" },
      { $match: { "history.actorType": "analyst" } },
      {
        $lookup: {
          from: "users",
          localField: "history.actorId",
          foreignField: "_id",
          as: "actor",
        },
      },
      { $sort: { "history.createdAt": -1 } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: query.limit },
            {
              $project: {
                _id: "$history._id",
                proposalId: "$_id",
                actorId: "$history.actorId",
                actorName: {
                  $ifNull: [{ $arrayElemAt: ["$actor.name", 0] }, null],
                },
                fromStatus: "$history.fromStatus",
                toStatus: "$history.toStatus",
                reasonCode: "$history.reasonCode",
                reason: "$history.reason",
                createdAt: "$history.createdAt",
              },
            },
          ],
          metadata: [{ $count: "total" }],
        },
      },
    ]).exec();

    return {
      data: (aggregation?.data ?? []).map((event) =>
        auditEventSchema.parse({
          id: event._id.toString(),
          proposalId: event.proposalId.toString(),
          actorId: event.actorId.toString(),
          actorName: event.actorName,
          fromStatus: event.fromStatus,
          toStatus: event.toStatus,
          reasonCode: event.reasonCode,
          reason: event.reason,
          createdAt: event.createdAt.toISOString(),
        }),
      ),
      total: aggregation?.metadata[0]?.total ?? 0,
    };
  },
};
