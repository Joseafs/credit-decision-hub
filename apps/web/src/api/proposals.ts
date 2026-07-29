import {
  createProposalSchema,
  proposalListResponseSchema,
  proposalSchema,
  type CreateProposalInput,
  type Proposal,
  type ProposalListResponse,
} from "@credit-decision-hub/contracts";

import { requestJson } from "./http";

const PROPOSAL_PAGE_LIMIT = 10;

export const listProposals = (
  page: number,
  signal?: AbortSignal,
): Promise<ProposalListResponse> =>
  requestJson(
    `/api/proposals?page=${page}&limit=${PROPOSAL_PAGE_LIMIT}`,
    proposalListResponseSchema,
    signal ? { signal } : undefined,
  );

export const getProposal = (
  proposalId: string,
  signal?: AbortSignal,
): Promise<Proposal> =>
  requestJson(
    `/api/proposals/${proposalId}`,
    proposalSchema,
    signal ? { signal } : undefined,
  );

export const createProposal = (input: CreateProposalInput): Promise<Proposal> =>
  requestJson("/api/proposals", proposalSchema, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(createProposalSchema.parse(input)),
  });
