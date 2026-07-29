import { Link } from "react-router-dom";

import { useAppPreferences } from "../../contexts/AppPreferencesContext";
import { formatCurrency, formatDate } from "../../i18n/formatters";
import { proposalRiskTranslationKeys } from "../../i18n/proposalLabels";
import { ProposalStatusBadge } from "../ProposalStatusBadge";
import type { ProposalListProps } from "./types";

export const ProposalList = ({ locale, proposals }: ProposalListProps) => {
  const { translate } = useAppPreferences();

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead className="bg-surface-subtle text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-5 py-4 font-semibold" scope="col">
                {translate("proposals.table.proposal")}
              </th>
              <th className="px-5 py-4 font-semibold" scope="col">
                {translate("proposals.table.amount")}
              </th>
              <th className="px-5 py-4 font-semibold" scope="col">
                {translate("proposals.table.status")}
              </th>
              <th className="px-5 py-4 font-semibold" scope="col">
                {translate("proposals.table.risk")}
              </th>
              <th className="px-5 py-4 font-semibold" scope="col">
                {translate("proposals.table.createdAt")}
              </th>
              <th className="px-5 py-4 text-right font-semibold" scope="col">
                <span className="sr-only">
                  {translate("proposals.table.action")}
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {proposals.map((proposal) => (
              <tr
                className="transition hover:bg-surface-subtle"
                key={proposal.id}
              >
                <td className="px-5 py-4">
                  <p className="font-mono text-sm font-semibold text-heading">
                    #{proposal.id.slice(-8).toUpperCase()}
                  </p>
                  <Link
                    className="mt-1 block font-mono text-xs text-muted hover:text-primary"
                    to={`/customers/${proposal.customerId}`}
                  >
                    {proposal.customerId}
                  </Link>
                </td>
                <td className="px-5 py-4 font-semibold text-heading">
                  {formatCurrency(proposal.requestedAmount, locale)}
                </td>
                <td className="px-5 py-4">
                  <ProposalStatusBadge status={proposal.status} />
                </td>
                <td className="px-5 py-4 text-sm text-body">
                  {translate(proposalRiskTranslationKeys[proposal.riskLevel])}
                </td>
                <td className="px-5 py-4 text-sm text-body">
                  {formatDate(proposal.createdAt, locale)}
                </td>
                <td className="px-5 py-4 text-right">
                  <Link
                    className="inline-flex rounded-lg px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary-soft"
                    to={`/proposals/${proposal.id}`}
                  >
                    {translate("proposals.table.action")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
