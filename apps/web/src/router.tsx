import { createBrowserRouter } from "react-router-dom";

import { AppShell } from "./components/AppShell";
import { AppPreferencesProvider } from "./contexts/AppPreferencesContext";
import { CustomerCreatePage } from "./pages/CustomerCreatePage";
import { CustomerDetailsPage } from "./pages/CustomerDetailsPage";
import { CustomersPage } from "./pages/CustomersPage";
import { HomePage } from "./pages/HomePage";
import { ProposalCreatePage } from "./pages/ProposalCreatePage";
import { ProposalDetailsPage } from "./pages/ProposalDetailsPage";
import { ProposalsPage } from "./pages/ProposalsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AppPreferencesProvider>
        <AppShell />
      </AppPreferencesProvider>
    ),
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "customers",
        element: <CustomersPage />,
      },
      {
        path: "customers/new",
        element: <CustomerCreatePage />,
      },
      {
        path: "customers/:customerId",
        element: <CustomerDetailsPage />,
      },
      {
        path: "proposals",
        element: <ProposalsPage />,
      },
      {
        path: "proposals/new",
        element: <ProposalCreatePage />,
      },
      {
        path: "proposals/:proposalId",
        element: <ProposalDetailsPage />,
      },
    ],
  },
]);
