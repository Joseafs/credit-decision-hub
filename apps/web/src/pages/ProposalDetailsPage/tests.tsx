import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { proposalFixture } from "../../test/fixtures";
import { renderWithProviders } from "../../test/render";
import { ProposalDetailsPage } from ".";

const fetchMock = vi.fn<typeof fetch>();

const componentRender = (state?: unknown) =>
  renderWithProviders(
    [
      {
        path: "/proposals/:proposalId",
        element: <ProposalDetailsPage />,
      },
    ],
    [
      {
        pathname: `/proposals/${proposalFixture.id}`,
        state,
      },
    ],
  );

describe("ProposalDetailsPage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    localStorage.clear();
    vi.stubGlobal("fetch", fetchMock);
  });

  test("should show the automatic decision and its history", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(proposalFixture), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    componentRender();

    expect(
      await screen.findByRole("heading", { name: "Decisão automática" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Aprovada")).toHaveLength(2);
    expect(screen.getAllByText("Critérios automáticos atendidos")).toHaveLength(
      2,
    );
    expect(screen.getByText("R$ 60.000,00")).toBeInTheDocument();
    expect(screen.getByText("29,41%")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /aprovar|rejeitar/i }),
    ).not.toBeInTheDocument();
  });

  test("should translate canonical proposal values into English", async () => {
    localStorage.setItem("cdh-locale", "en");
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(proposalFixture), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    componentRender();

    expect(
      await screen.findByRole("heading", { name: "Automatic decision" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Approved")).toHaveLength(2);
    expect(screen.getAllByText("Automatic criteria met")).toHaveLength(2);
    expect(screen.getByText("Low")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Decision history" }),
    ).toBeInTheDocument();
  });

  test("should show confirmation after a proposal is created", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(proposalFixture), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    componentRender({ proposalCreated: true });

    expect(
      await screen.findByText("Proposta avaliada com sucesso."),
    ).toBeInTheDocument();
  });

  test("should show an error state when proposal loading fails", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "Proposal not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
    );

    componentRender();

    expect(
      await screen.findByText("Proposta não encontrada"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Voltar para propostas" }),
    ).toHaveAttribute("href", "/proposals");
  });
});
