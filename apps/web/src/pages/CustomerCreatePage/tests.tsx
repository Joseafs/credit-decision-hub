import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { customerFixture } from "../../test/fixtures";
import { renderWithProviders } from "../../test/render";
import { CustomerCreatePage } from ".";

const fetchMock = vi.fn<typeof fetch>();

const componentRender = () =>
  renderWithProviders(
    [
      { path: "/customers/new", element: <CustomerCreatePage /> },
      { path: "/customers/:customerId", element: <p>Customer details</p> },
    ],
    ["/customers/new"],
  );

const fillForm = () => {
  fireEvent.change(screen.getByLabelText("Nome completo"), {
    target: { value: "Marina Costa" },
  });
  fireEvent.change(screen.getByLabelText("Documento fictício"), {
    target: { value: "FAKE-000001" },
  });
  fireEvent.change(screen.getByLabelText("E-mail"), {
    target: { value: "MARINA.COSTA@EXAMPLE.TEST" },
  });
  fireEvent.change(screen.getByLabelText("Telefone"), {
    target: { value: "+55 11 90000-0000" },
  });
  fireEvent.change(screen.getByLabelText("Renda mensal"), {
    target: { value: "8500" },
  });
  fireEvent.change(screen.getByLabelText("Ocupação"), {
    target: { value: "Analista de sistemas" },
  });
};

describe("CustomerCreatePage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  test("should validate required fields before requesting the API", async () => {
    componentRender();

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar cliente" }));

    expect(await screen.findAllByText("Revise este campo.")).toHaveLength(6);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("should submit normalized data and navigate to customer details", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(customerFixture), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const { router } = componentRender();
    fillForm();

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar cliente" }));

    expect(await screen.findByText("Customer details")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(
      `/customers/${customerFixture.id}`,
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/customers",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("marina.costa@example.test"),
      }),
    );
  });

  test("should show a specific conflict message returned as status 409", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "Customer already exists" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      }),
    );
    componentRender();
    fillForm();

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar cliente" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Já existe um cliente com este documento ou e-mail.",
      );
    });
  });
});
