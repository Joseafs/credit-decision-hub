import type { Proposal } from "@credit-decision-hub/contracts";
import { FeedbackState } from "@credit-decision-hub/ui";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { getProposal } from "../../api/proposals";
import { ProposalStatusBadge } from "../../components/ProposalStatusBadge";
import { useAppPreferences } from "../../contexts/AppPreferencesContext";
import {
  formatCurrency,
  formatDateTime,
  formatPercent,
} from "../../i18n/formatters";
import {
  proposalActorTranslationKeys,
  proposalFraudSignalTranslationKeys,
  proposalReasonTranslationKeys,
  proposalRiskTranslationKeys,
  proposalStatusTranslationKeys,
} from "../../i18n/proposalLabels";

type ProposalDetailsState =
  | { status: "loading" }
  | { status: "success"; proposal: Proposal }
  | { status: "error" };

const wasProposalCreated = (state: unknown): boolean =>
  typeof state === "object" &&
  state !== null &&
  "proposalCreated" in state &&
  state.proposalCreated === true;

export const ProposalDetailsPage = () => {
  const { proposalId = "" } = useParams();
  const location = useLocation();
  const [proposalState, setProposalState] = useState<ProposalDetailsState>({
    status: "loading",
  });
  const { locale, translate } = useAppPreferences();

  useEffect(() => {
    const controller = new AbortController();

    const loadProposal = async () => {
      try {
        const proposal = await getProposal(proposalId, controller.signal);
        setProposalState({ status: "success", proposal });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setProposalState({ status: "error" });
      }
    };

    void loadProposal();

    return () => controller.abort();
  }, [proposalId]);

  if (proposalState.status === "loading") {
    return <FeedbackState title={translate("proposal.detail.loading")} />;
  }

  if (proposalState.status === "error") {
    return (
      <FeedbackState
        action={
          <Link
            className="inline-flex rounded-lg bg-danger px-4 py-2 font-semibold text-white"
            to="/proposals"
          >
            {translate("proposal.detail.back")}
          </Link>
        }
        description={translate("proposal.detail.errorDescription")}
        title={translate("proposal.detail.errorTitle")}
        tone="danger"
      />
    );
  }

  const { proposal } = proposalState;

  return (
    <section className="mx-auto max-w-5xl">
      <Link
        className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary-hover"
        to="/proposals"
      >
        <span aria-hidden="true" className="mr-2">
          ←
        </span>
        {translate("proposal.detail.back")}
      </Link>

      {wasProposalCreated(location.state) && (
        <p
          className="mt-6 rounded-xl bg-success-soft p-4 font-medium text-success"
          role="status"
        >
          {translate("proposal.detail.created")}
        </p>
      )}

      <header className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="font-mono text-sm text-primary">
              #{proposal.id.toUpperCase()}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-heading">
              {translate("proposal.detail.automaticDecision")}
            </h1>
            <p className="mt-3 max-w-2xl text-muted">
              {translate(
                proposalReasonTranslationKeys[proposal.decisionReasonCode],
              )}
            </p>
          </div>
          <ProposalStatusBadge status={proposal.status} />
        </div>

        <p className="mt-6 rounded-xl bg-primary-soft p-4 text-sm text-primary">
          {translate("proposal.detail.automaticNotice")}
        </p>
      </header>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">
            {translate("proposal.detail.requestedAmount")}
          </p>
          <p className="mt-2 text-xl font-semibold text-heading">
            {formatCurrency(proposal.requestedAmount, locale)}
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">
            {translate("proposal.detail.installmentAmount")}
          </p>
          <p className="mt-2 text-xl font-semibold text-heading">
            {formatCurrency(proposal.estimatedInstallmentAmount, locale)}
          </p>
          <p className="mt-1 text-xs text-muted">
            {translate("proposal.detail.installments", {
              count: proposal.installments,
            })}
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">
            {translate("proposal.detail.incomeCommitment")}
          </p>
          <p className="mt-2 text-xl font-semibold text-heading">
            {proposal.incomeCommitment === null
              ? translate("common.notAvailable")
              : formatPercent(proposal.incomeCommitment, locale)}
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">
            {translate("proposal.detail.risk")}
          </p>
          <p className="mt-2 text-xl font-semibold text-heading">
            {translate(proposalRiskTranslationKeys[proposal.riskLevel])}
          </p>
        </article>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <article className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-heading">
            {translate("proposal.detail.customer")}
          </h2>
          <Link
            className="mt-4 block break-all font-mono text-sm text-primary hover:text-primary-hover"
            to={`/customers/${proposal.customerId}`}
          >
            {proposal.customerId}
          </Link>
          <dl className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-muted">
                {translate("proposal.detail.score")}
              </dt>
              <dd className="mt-1 font-semibold text-heading">
                {proposal.score}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted">
                {translate("proposal.detail.documents")}
              </dt>
              <dd className="mt-1 font-semibold text-heading">
                {proposal.documentsComplete
                  ? translate("proposal.detail.complete")
                  : translate("proposal.detail.incomplete")}
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-heading">
            {translate("proposal.detail.fraudSignals")}
          </h2>
          {proposal.fraudSignals.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              {translate("proposal.form.noFraudSignals")}
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {proposal.fraudSignals.map((signal) => (
                <li
                  className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
                  key={signal}
                >
                  {translate(proposalFraudSignalTranslationKeys[signal])}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-5 text-xs text-muted">
            {translate("proposal.detail.createdAt")}:{" "}
            {formatDateTime(proposal.createdAt, locale)}
            <br />
            {translate("proposal.detail.updatedAt")}:{" "}
            {formatDateTime(proposal.updatedAt, locale)}
          </p>
        </article>
      </div>

      <article className="mt-5 rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-heading">
          {translate("proposal.detail.history")}
        </h2>
        <ol className="mt-6 space-y-6">
          {proposal.history.map((event) => (
            <li
              className="relative border-l-2 border-border pl-6 before:absolute before:-left-[7px] before:top-1 before:h-3 before:w-3 before:rounded-full before:bg-primary"
              key={event.id}
            >
              <div className="flex flex-wrap items-center gap-3">
                <ProposalStatusBadge status={event.toStatus} />
                <time className="text-xs text-muted">
                  {formatDateTime(event.createdAt, locale)}
                </time>
              </div>
              <p className="mt-3 font-medium text-heading">
                {translate(proposalReasonTranslationKeys[event.reasonCode])}
              </p>
              <div className="mt-2 space-y-1 text-xs text-muted">
                {event.fromStatus && (
                  <p>
                    {translate("proposal.detail.previousStatus", {
                      status: translate(
                        proposalStatusTranslationKeys[event.fromStatus],
                      ),
                    })}
                  </p>
                )}
                <p>
                  {translate("proposal.detail.actor", {
                    actor: translate(
                      proposalActorTranslationKeys[event.actorType],
                    ),
                  })}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </article>
    </section>
  );
};
