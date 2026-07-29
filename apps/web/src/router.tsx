import { createBrowserRouter } from "react-router-dom";

import { AppShell } from "./components/AppShell";
import { AppPreferencesProvider } from "./contexts/AppPreferencesContext";
import { CustomerCreatePage } from "./pages/CustomerCreatePage";
import { CustomerDetailsPage } from "./pages/CustomerDetailsPage";
import { CustomersPage } from "./pages/CustomersPage";
import { HomePage } from "./pages/HomePage";

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
    ],
  },
]);
