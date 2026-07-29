import { createBrowserRouter } from "react-router-dom";

import { AppShell } from "./components/AppShell";
import { AdminRoute } from "./components/AdminRoute";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppPreferencesProvider } from "./contexts/AppPreferencesContext";
import { AuthProvider } from "./contexts/AuthContext";
import { CustomerCreatePage } from "./pages/CustomerCreatePage";
import { CustomerDetailsPage } from "./pages/CustomerDetailsPage";
import { CustomersPage } from "./pages/CustomersPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { ProposalCreatePage } from "./pages/ProposalCreatePage";
import { ProposalDetailsPage } from "./pages/ProposalDetailsPage";
import { ProposalsPage } from "./pages/ProposalsPage";
import { UsersPage } from "./pages/UsersPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <AppPreferencesProvider>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </AppPreferencesProvider>
    ),
  },
  {
    path: "/",
    element: (
      <AppPreferencesProvider>
        <AuthProvider>
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        </AuthProvider>
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
      {
        path: "users",
        element: (
          <AdminRoute>
            <UsersPage />
          </AdminRoute>
        ),
      },
    ],
  },
]);
