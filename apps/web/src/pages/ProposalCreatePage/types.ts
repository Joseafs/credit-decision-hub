import type {
  CreateProposalInput,
  Customer,
} from "@credit-decision-hub/contracts";

export type ProposalFormValues = Omit<
  CreateProposalInput,
  "requestedAmount" | "installments" | "score"
> & {
  requestedAmount: string;
  installments: string;
  score: string;
};

export type CustomerOptionsState =
  | { status: "loading" }
  | { status: "success"; customers: Customer[] }
  | { status: "error" };
