import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { customerFixture, proposalFixture } from "../../test/fixtures";
import { renderWithProviders } from "../../test/render";
import { ProposalCreatePage } from ".";

const fetchMock = vi.fn<typeof fetch>();

const customerListResponse = () =>
  new Response(
    JSON.stringify({
      data: [customerFixture],
      pagination: {
        page: 1,
        limit: 100,
        total: 1,
        totalPages: 1,
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );

const componentRender = () =>
  renderWithProviders(
    [
      { path: "/proposals/new", element: <ProposalCreatePage /> },
      { path: "/proposals/:proposalId", element: <p>Proposal details</p> },
    ],
    ["/proposals/new"],
  );

const fillForm = async () => {
  await screen.findByRole("option", {
    name: `${customerFixture.name} · ${customerFixture.document}`,
  });
  fireEvent.change(screen.getByLabelText("Cliente"), {
    target: { value: customerFixture.id },
  });
  fireEvent.change(screen.getByLabelText("Valor solicitado"), {
    target: { value: "60000" },
  });
  fireEvent.change(screen.getByLabelText("Quantidade de parcelas"), {
    target: { value: "24" },
  });
  fireEvent.change(screen.getByLabelText("Score fictício"), {
    target: { value: "750" },
  });
};

describe("ProposalCreatePage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  test("should load fictional customers as proposal options", async () => {
    fetchMock.mockResolvedValue(customerListResponse());

    componentRender();

    expect(
      await screen.findByRole("option", {
        name: `${customerFixture.name} · ${customerFixture.document}`,
      }),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/customers?page=1&limit=100",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  test("should validate the contract fields before requesting the API", async () => {
    fetchMock.mockResolvedValue(customerListResponse());
    componentRender();
    await screen.findByRole("combobox", { name: "Cliente" });

    fireEvent.click(screen.getByRole("button", { name: "Avaliar proposta" }));

    expect(await screen.findAllByText("Revise este campo.")).toHaveLength(4);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("should submit contract data and navigate to the automatic result", async () => {
    fetchMock.mockImplementation(async (input) => {
      if (input === "/api/customers?page=1&limit=100") {
        return customerListResponse();
      }

      return new Response(JSON.stringify(proposalFixture), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    });
    const { router } = componentRender();
    await fillForm();

    fireEvent.click(screen.getByRole("button", { name: "Avaliar proposta" }));

    expect(await screen.findByText("Proposal details")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(
      `/proposals/${proposalFixture.id}`,
    );
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/proposals",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          customerId: customerFixture.id,
          requestedAmount: 60_000,
          installments: 24,
          score: 750,
          documentsComplete: true,
          fraudSignals: [],
        }),
      }),
    );
  });

  test("should submit selected fraud signals through the shared contract", async () => {
    fetchMock.mockImplementation(async (input) => {
      if (input === "/api/customers?page=1&limit=100") {
        return customerListResponse();
      }

      return new Response(
        JSON.stringify({
          ...proposalFixture,
          fraudSignals: ["document_mismatch"],
          riskLevel: "high",
          status: "fraud_suspected",
          decisionReasonCode: "fraud_signal_detected",
          decisionReason: "Indício de fraude identificado",
          history: [
            proposalFixture.history[0],
            {
              ...proposalFixture.history[1],
              toStatus: "fraud_suspected",
              reasonCode: "fraud_signal_detected",
              reason: "Indício de fraude identificado",
            },
          ],
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        },
      );
    });
    componentRender();
    await fillForm();
    fireEvent.click(screen.getByLabelText("Documento divergente"));

    fireEvent.click(screen.getByRole("button", { name: "Avaliar proposta" }));

    await screen.findByText("Proposal details");
    const request = fetchMock.mock.calls.at(-1)?.[1];
    expect(request?.body).toContain('"fraudSignals":["document_mismatch"]');
  });

  test("should show a customer error returned as status 404", async () => {
    fetchMock.mockImplementation(async (input) => {
      if (input === "/api/customers?page=1&limit=100") {
        return customerListResponse();
      }

      return new Response(
        JSON.stringify({ message: "Cliente não encontrado" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    });
    componentRender();
    await fillForm();

    fireEvent.click(screen.getByRole("button", { name: "Avaliar proposta" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "O cliente selecionado não está mais disponível.",
      );
    });
  });
});
