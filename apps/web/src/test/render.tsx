import { render } from "@testing-library/react";
import {
  createMemoryRouter,
  RouterProvider,
  type InitialEntry,
  type RouteObject,
} from "react-router-dom";

import { AppPreferencesProvider } from "../contexts/AppPreferencesContext";

export const renderWithProviders = (
  routes: RouteObject[],
  initialEntries: InitialEntry[],
) => {
  const router = createMemoryRouter(routes, { initialEntries });

  return {
    router,
    ...render(
      <AppPreferencesProvider>
        <RouterProvider router={router} />
      </AppPreferencesProvider>,
    ),
  };
};
