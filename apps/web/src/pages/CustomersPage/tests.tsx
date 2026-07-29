import { act, fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { AppHeader } from "../../components/AppHeader";
import { customerFixture } from "../../test/fixtures";
import { renderWithProviders } from "../../test/render";
import { CustomersPage } from ".";

const fetchMock = vi.fn<typeof fetch>();

const listResponse = (data = [customerFixture], page = 1, totalPages = 1) =>
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

const componentRender = (initialEntry = "/customers") =>
  renderWithProviders(
    [{ path: "/customers", element: <CustomersPage /> }],
    [initialEntry],
  );

describe("CustomersPage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  test("should show loading while customers are requested", async () => {
    let resolveRequest: (response: Response) => void = () => undefined;
    const pendingRequest = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });
    fetchMock.mockReturnValue(pendingRequest);

    componentRender();

    expect(screen.getByText("Carregando clientes...")).toBeInTheDocument();

    await act(async () => {
      resolveRequest(listResponse());
      await pendingRequest;
    });
  });

  test("should list customers returned by the shared API contract", async () => {
    fetchMock.mockResolvedValue(listResponse());

    componentRender();

    expect(await screen.findByText(customerFixture.name)).toBeInTheDocument();
    expect(screen.getByText(customerFixture.email)).toBeInTheDocument();
    expect(screen.getByText("R$ 8.500,00")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/customers?page=1&limit=10",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  test("should show an empty state with a customer creation action", async () => {
    fetchMock.mockResolvedValue(listResponse([], 1, 0));

    componentRender();

    expect(
      await screen.findByText("Nenhum cliente cadastrado"),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: "Novo cliente" })
        .every((link) => link.getAttribute("href") === "/customers/new"),
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

    expect(await screen.findByText(customerFixture.name)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("should request the next page through pagination", async () => {
    fetchMock
      .mockResolvedValueOnce(listResponse([customerFixture], 1, 2))
      .mockResolvedValueOnce(listResponse([customerFixture], 2, 2));

    const { router } = componentRender();

    fireEvent.click(await screen.findByRole("button", { name: "Próxima" }));

    expect(await screen.findByText("Página 2 de 2")).toBeInTheDocument();
    expect(router.state.location.search).toBe("?page=2");
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/customers?page=2&limit=10",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  test("should restore the customer page from a valid URL", async () => {
    fetchMock.mockResolvedValue(listResponse([customerFixture], 2, 3));

    componentRender("/customers?page=2");

    expect(await screen.findByText("Página 2 de 3")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/customers?page=2&limit=10",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  test("should translate labels without changing the income currency", async () => {
    fetchMock.mockResolvedValue(listResponse());
    renderWithProviders(
      [
        {
          path: "/customers",
          element: (
            <>
              <AppHeader />
              <CustomersPage />
            </>
          ),
        },
      ],
      ["/customers"],
    );

    await screen.findByText("R$ 8.500,00");
    fireEvent.click(screen.getByRole("button", { name: "EN" }));

    expect(
      screen.getByRole("heading", { name: "Customers" }),
    ).toBeInTheDocument();
    expect(screen.getByText("R$8,500.00")).toBeInTheDocument();
  });
});
