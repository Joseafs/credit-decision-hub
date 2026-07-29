import {
  createProposalSchema,
  listProposalsQuerySchema,
  manualProposalDecisionSchema,
  proposalListResponseSchema,
  proposalSchema,
  type CreateProposalInput,
  type ListProposalsQuery,
  type ManualProposalDecisionInput,
  type Proposal,
  type ProposalListResponse,
} from "@credit-decision-hub/contracts";

import { requestJson } from "./http";

const PROPOSAL_PAGE_LIMIT = 10;

export const parseProposalListQuery = (
  searchParams: URLSearchParams,
): ListProposalsQuery => {
  const query = Object.fromEntries(searchParams);

  return listProposalsQuerySchema.parse({
    ...query,
    limit: query.limit ?? PROPOSAL_PAGE_LIMIT,
  });
};

export const serializeProposalListQuery = (
  input: ListProposalsQuery,
): URLSearchParams => {
  const query = listProposalsQuerySchema.parse(input);
  const searchParams = new URLSearchParams();

  if (query.page > 1) {
    searchParams.set("page", String(query.page));
  }

  if (query.limit !== PROPOSAL_PAGE_LIMIT) {
    searchParams.set("limit", String(query.limit));
  }

  const optionalFields = [
    "customerId",
    "status",
    "riskLevel",
    "createdFrom",
    "createdTo",
    "minRequestedAmount",
    "maxRequestedAmount",
  ] as const;

  optionalFields.forEach((field) => {
    const value = query[field];

    if (value !== undefined) {
      searchParams.set(field, String(value));
    }
  });

  return searchParams;
};

export const listProposals = (
  input: ListProposalsQuery,
  signal?: AbortSignal,
): Promise<ProposalListResponse> => {
  const searchParams = serializeProposalListQuery(input);
  searchParams.set("page", String(input.page));
  searchParams.set("limit", String(input.limit));

  return requestJson(
    `/api/proposals?${searchParams.toString()}`,
    proposalListResponseSchema,
    signal ? { signal } : undefined,
  );
};

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

export const decideProposal = (
  proposalId: string,
  input: ManualProposalDecisionInput,
): Promise<Proposal> =>
  requestJson(`/api/proposals/${proposalId}/decision`, proposalSchema, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(manualProposalDecisionSchema.parse(input)),
  });
