import { act, fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { proposalFixture } from "../../test/fixtures";
import { renderWithProviders } from "../../test/render";
import { ProposalsPage } from ".";

const fetchMock = vi.fn<typeof fetch>();

const listResponse = (data = [proposalFixture], page = 1, totalPages = 1) =>
  new Response(
    JSON.stringify({
      data,
      pagination: {
        page,
        limit: 10,
        total: data.length,
        totalPages,
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );

const componentRender = () =>
  renderWithProviders(
    [{ path: "/proposals", element: <ProposalsPage /> }],
    ["/proposals"],
  );

describe("ProposalsPage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  test("should show loading while proposals are requested", async () => {
    let resolveRequest: (response: Response) => void = () => undefined;
    const pendingRequest = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });
    fetchMock.mockReturnValue(pendingRequest);

    componentRender();

    expect(screen.getByText("Carregando propostas...")).toBeInTheDocument();

    await act(async () => {
      resolveRequest(listResponse());
      await pendingRequest;
    });
  });

  test("should list automatic proposal results with readable labels", async () => {
    fetchMock.mockResolvedValue(listResponse());

    componentRender();

    expect(await screen.findByText("R$ 60.000,00")).toBeInTheDocument();
    expect(screen.getByText("Aprovada")).toBeInTheDocument();
    expect(screen.getByText("Baixo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Detalhes" })).toHaveAttribute(
      "href",
      `/proposals/${proposalFixture.id}`,
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/proposals?page=1&limit=10",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  test("should show an empty state with a proposal creation action", async () => {
    fetchMock.mockResolvedValue(listResponse([], 1, 0));

    componentRender();

    expect(
      await screen.findByText("Nenhuma proposta cadastrada"),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: "Nova proposta" })
        .every((link) => link.getAttribute("href") === "/proposals/new"),
    ).toBe(true);
  });

  test("should retry after an API error", async () => {
    fetchMock
      .mockRejectedValueOnce(new Error("API unavailable"))
      .mockResolvedValueOnce(listResponse());

    componentRender();

    fireEvent.click(
      await screen.findByRole("button", { name: "Tentar novamente" }),
    );

    expect(await screen.findByText("Aprovada")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("should request the next page through pagination", async () => {
    fetchMock
      .mockResolvedValueOnce(listResponse([proposalFixture], 1, 2))
      .mockResolvedValueOnce(listResponse([proposalFixture], 2, 2));

    componentRender();

    fireEvent.click(await screen.findByRole("button", { name: "Próxima" }));

    expect(await screen.findByText("Página 2 de 2")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/proposals?page=2&limit=10",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });
});
