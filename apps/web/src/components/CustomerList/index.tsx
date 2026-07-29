import { Link } from "react-router-dom";

import { useAppPreferences } from "../../contexts/AppPreferencesContext";
import { formatCurrency } from "../../i18n/formatters";
import type { CustomerListProps } from "./types";

export const CustomerList = ({ customers, locale }: CustomerListProps) => {
  const { translate } = useAppPreferences();

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead className="bg-surface-subtle text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-5 py-4 font-semibold" scope="col">
                {translate("customers.table.name")}
              </th>
              <th className="px-5 py-4 font-semibold" scope="col">
                {translate("customers.table.document")}
              </th>
              <th className="px-5 py-4 font-semibold" scope="col">
                {translate("customers.table.income")}
              </th>
              <th className="px-5 py-4 font-semibold" scope="col">
                {translate("customers.table.occupation")}
              </th>
              <th className="px-5 py-4 text-right font-semibold" scope="col">
                <span className="sr-only">
                  {translate("customers.table.action")}
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {customers.map((customer) => (
              <tr
                className="transition hover:bg-surface-subtle"
                key={customer.id}
              >
                <td className="px-5 py-4">
                  <p className="font-semibold text-heading">{customer.name}</p>
                  <p className="mt-1 text-sm text-muted">{customer.email}</p>
                </td>
                <td className="px-5 py-4 font-mono text-sm text-body">
                  {customer.document}
                </td>
                <td className="px-5 py-4 text-sm text-body">
                  {formatCurrency(customer.monthlyIncome, locale)}
                </td>
                <td className="px-5 py-4 text-sm text-body">
                  {customer.occupation}
                </td>
                <td className="px-5 py-4 text-right">
                  <Link
                    className="inline-flex rounded-lg px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary-soft"
                    to={`/customers/${customer.id}`}
                  >
                    {translate("customers.table.action")}
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
