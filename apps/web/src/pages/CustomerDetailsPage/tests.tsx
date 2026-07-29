import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { customerFixture } from "../../test/fixtures";
import { renderWithProviders } from "../../test/render";
import { CustomerDetailsPage } from ".";

const fetchMock = vi.fn<typeof fetch>();

const componentRender = (state?: unknown) =>
  renderWithProviders(
    [
      {
        path: "/customers/:customerId",
        element: <CustomerDetailsPage />,
      },
    ],
    [
      {
        pathname: `/customers/${customerFixture.id}`,
        state,
      },
    ],
  );

describe("CustomerDetailsPage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  test("should show customer details returned by the API", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(customerFixture), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    componentRender();

    expect(
      await screen.findByRole("heading", { name: customerFixture.name }),
    ).toBeInTheDocument();
    expect(screen.getByText(customerFixture.phone)).toBeInTheDocument();
    expect(screen.getByText("R$ 8.500,00")).toBeInTheDocument();
  });

  test("should show confirmation after a customer is created", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(customerFixture), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    componentRender({ customerCreated: true });

    expect(
      await screen.findByText("Cliente cadastrado com sucesso."),
    ).toBeInTheDocument();
  });

  test("should show an error state when customer loading fails", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "Customer not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
    );

    componentRender();

    expect(
      await screen.findByText("Cliente não encontrado"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Voltar para clientes" }),
    ).toHaveAttribute("href", "/customers");
  });
});
