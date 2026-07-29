import type { ManualProposalDecisionInput } from "@credit-decision-hub/contracts";
import { Button } from "@credit-decision-hub/ui";
import { useFormik } from "formik";
import { useState } from "react";

import { decideProposal } from "../../api/proposals";
import { useAppPreferences } from "../../contexts/AppPreferencesContext";
import type { ManualProposalDecisionProps } from "./types";

export const ManualProposalDecision = ({
  proposal,
  onDecided,
}: ManualProposalDecisionProps) => {
  const { translate } = useAppPreferences();
  const [hasError, setHasError] = useState(false);
  const availableStatuses: ManualProposalDecisionInput["status"][] =
    proposal.status === "manual_review"
      ? ["approved", "rejected"]
      : proposal.status === "fraud_suspected"
        ? ["manual_review", "rejected"]
        : [];
  const formik = useFormik({
    initialValues: { status: availableStatuses[0] ?? "rejected", reason: "" },
    onSubmit: async (values) => {
      setHasError(false);
      try {
        onDecided(
          await decideProposal(proposal.id, {
            status: values.status,
            reason: values.reason,
          }),
        );
      } catch {
        setHasError(true);
      }
    },
  });

  if (availableStatuses.length === 0) return null;

  const statusLabels = {
    approved: "proposal.decision.approve",
    rejected: "proposal.decision.reject",
    manual_review: "proposal.decision.review",
  } as const;

  return (
    <section className="mt-5 rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-xl font-semibold text-heading">
        {translate("proposal.decision.title")}
      </h2>
      <p className="mt-2 text-sm text-muted">
        {translate("proposal.decision.description")}
      </p>
      <form className="mt-5 grid gap-4" onSubmit={formik.handleSubmit}>
        <label className="text-sm font-medium text-heading">
          {translate("proposal.decision.status")}
          <select
            className="mt-2 w-full rounded-xl border border-border bg-canvas px-4 py-3"
            name="status"
            onChange={formik.handleChange}
            value={formik.values.status}
          >
            {availableStatuses.map((status) => (
              <option key={status} value={status}>
                {translate(statusLabels[status])}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-heading">
          {translate("proposal.decision.reason")}
          <textarea
            className="mt-2 min-h-24 w-full rounded-xl border border-border bg-canvas px-4 py-3"
            maxLength={240}
            minLength={3}
            name="reason"
            onChange={formik.handleChange}
            required
            value={formik.values.reason}
          />
        </label>
        {hasError && (
          <p className="text-sm text-danger" role="alert">
            {translate("proposal.decision.error")}
          </p>
        )}
        <Button disabled={formik.isSubmitting} type="submit">
          {formik.isSubmitting
            ? translate("proposal.decision.submitting")
            : translate("proposal.decision.submit")}
        </Button>
      </form>
    </section>
  );
};
