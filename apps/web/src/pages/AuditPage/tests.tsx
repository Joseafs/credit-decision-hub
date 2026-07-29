import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { renderWithProviders } from "../../test/render";
import { AuditPage } from ".";

const fetchMock = vi.fn<typeof fetch>();

describe("AuditPage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  test("should list manual decisions with actor and proposal access", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [
            {
              id: "670000000000000000000001",
              proposalId: "660000000000000000000001",
              actorId: "650000000000000000000001",
              actorName: "Analista Demo",
              fromStatus: "manual_review",
              toStatus: "approved",
              reasonCode: "manual_approval",
              reason: "Documentação conferida",
              createdAt: "2026-07-29T13:00:00.000Z",
            },
          ],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    renderWithProviders(
      [{ path: "/audit", element: <AuditPage /> }],
      ["/audit"],
    );

    expect(await screen.findByText("Analista Demo")).toBeInTheDocument();
    expect(screen.getByText("Documentação conferida")).toBeInTheDocument();
    expect(screen.getByText(/Análise manual/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver proposta" })).toHaveAttribute(
      "href",
      "/proposals/660000000000000000000001",
    );
  });
});
