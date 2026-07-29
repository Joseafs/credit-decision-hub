import { render, screen } from "@testing-library/react";
import {
  createMemoryRouter,
  RouterProvider,
  type RouteObject,
} from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { AppPreferencesProvider } from "../../contexts/AppPreferencesContext";
import { AuthProvider } from "../../contexts/AuthContext";
import { DashboardPage } from ".";

const fetchMock = vi.fn<typeof fetch>();
const user = {
  id: "650000000000000000000001",
  name: "Admin Demo",
  email: "admin@example.test",
  role: "admin",
  active: true,
  createdAt: "2026-07-29T12:00:00.000Z",
};
const summary = {
  totalProposals: 10,
  totalRequestedAmount: 250_000,
  approvalRate: 50,
  pendingActionCount: 2,
  manualDecisionCount: 3,
  myDecisionCount: 1,
  statusDistribution: [
    { status: "pending", count: 0 },
    { status: "approved", count: 5 },
    { status: "rejected", count: 3 },
    { status: "manual_review", count: 1 },
    { status: "pending_documents", count: 0 },
    { status: "fraud_suspected", count: 1 },
  ],
  riskDistribution: [
    { riskLevel: "low", count: 5 },
    { riskLevel: "medium", count: 3 },
    { riskLevel: "high", count: 2 },
  ],
};
const analyticsSummary = {
  source: "databricks",
  datasetVersion: "1",
  totalProposals: 1_000,
  approvedProposals: 200,
  approvalRate: 20,
  totalRequestedAmount: 70_816_365.76,
  averageRequestedAmount: 70_816.37,
  averageIncomeCommitment: 11.09,
};

const componentRender = () => {
  const routes: RouteObject[] = [
    { path: "/dashboard", element: <DashboardPage /> },
    { path: "/audit", element: <p>Auditoria</p> },
  ];
  const router = createMemoryRouter(routes, {
    initialEntries: ["/dashboard"],
  });

  return render(
    <AppPreferencesProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </AppPreferencesProvider>,
  );
};

describe("DashboardPage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (input) => {
      const path = String(input);
      const payload = path.includes("/auth/session")
        ? { user }
        : path.includes("/analytics/summary")
          ? analyticsSummary
          : summary;

      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  test("should show operational indicators and the administrator perspective", async () => {
    componentRender();

    expect(await screen.findByText("R$ 250.000,00")).toBeInTheDocument();
    expect(screen.getByText("Taxa de aprovação")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("Decisões manuais")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Consultar auditoria" }),
    ).toHaveAttribute("href", "/audit");
    expect(
      await screen.findByText("Resultados processados no Databricks"),
    ).toBeInTheDocument();
    expect(screen.getByText("R$ 70.816,37")).toBeInTheDocument();
    expect(screen.getByText("11,09%")).toBeInTheDocument();
    expect(screen.getByText("v1")).toBeInTheDocument();
  });

  test("should preserve the operational dashboard when analytics is unavailable", async () => {
    fetchMock.mockImplementation(async (input) => {
      const path = String(input);

      if (path.includes("/analytics/summary")) {
        return Response.json(
          { message: "Indicadores analíticos temporariamente indisponíveis" },
          { status: 503 },
        );
      }

      return Response.json(path.includes("/auth/session") ? { user } : summary);
    });

    componentRender();

    expect(await screen.findByText("R$ 250.000,00")).toBeInTheDocument();
    expect(
      await screen.findByText(
        "Os indicadores analíticos estão temporariamente indisponíveis.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tentar novamente" }),
    ).toBeInTheDocument();
  });
});
