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

const componentRender = (initialEntry = "/proposals") =>
  renderWithProviders(
    [{ path: "/proposals", element: <ProposalsPage /> }],
    [initialEntry],
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
    expect(screen.getAllByText("Aprovada")).toHaveLength(2);
    expect(screen.getAllByText("Baixo")).toHaveLength(2);
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

    const { router } = componentRender();

    fireEvent.click(await screen.findByRole("button", { name: "Próxima" }));

    expect(await screen.findByText("Página 2 de 2")).toBeInTheDocument();
    expect(router.state.location.search).toBe("?page=2");
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/proposals?page=2&limit=10",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  test("should apply shared filters and reset pagination in the URL", async () => {
    fetchMock.mockResolvedValue(listResponse());
    const { router } = componentRender("/proposals?page=3");

    await screen.findByRole("link", { name: "Detalhes" });
    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "rejected" },
    });
    fireEvent.change(screen.getByLabelText("Risco"), {
      target: { value: "high" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(await screen.findByDisplayValue("Reprovada")).toBeInTheDocument();
    expect(router.state.location.search).toBe(
      "?status=rejected&riskLevel=high",
    );
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/proposals?status=rejected&riskLevel=high&page=1&limit=10",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  test("should preserve filters when requesting the next page", async () => {
    fetchMock
      .mockResolvedValueOnce(listResponse([proposalFixture], 1, 2))
      .mockResolvedValueOnce(listResponse([proposalFixture], 2, 2));
    const { router } = componentRender("/proposals?status=approved");

    fireEvent.click(await screen.findByRole("button", { name: "Próxima" }));

    expect(await screen.findByText("Página 2 de 2")).toBeInTheDocument();
    expect(router.state.location.search).toBe("?page=2&status=approved");
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/proposals?page=2&status=approved&limit=10",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  test("should distinguish an empty filtered result and clear filters", async () => {
    fetchMock
      .mockResolvedValueOnce(listResponse([], 1, 0))
      .mockResolvedValueOnce(listResponse());
    const { router } = componentRender("/proposals?status=rejected");

    expect(
      await screen.findByText("Nenhuma proposta encontrada"),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getAllByRole("button", { name: "Limpar filtros" })[0]!,
    );

    expect(
      await screen.findByRole("link", { name: "Detalhes" }),
    ).toBeInTheDocument();
    expect(router.state.location.search).toBe("");
  });

  test("should reject inverted filter ranges before requesting the API", async () => {
    fetchMock.mockResolvedValue(listResponse());
    componentRender();

    await screen.findByRole("link", { name: "Detalhes" });
    fireEvent.change(screen.getByLabelText("Valor mínimo"), {
      target: { value: "2000" },
    });
    fireEvent.change(screen.getByLabelText("Valor máximo"), {
      target: { value: "1000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Revise os intervalos");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
