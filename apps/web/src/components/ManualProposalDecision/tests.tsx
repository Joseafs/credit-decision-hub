import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { proposalFixture } from "../../test/fixtures";
import { renderWithProviders } from "../../test/render";
import { ManualProposalDecision } from ".";

const fetchMock = vi.fn<typeof fetch>();

describe("ManualProposalDecision", () => {
  test("should submit an allowed decision and return the updated proposal", async () => {
    const proposal = {
      ...proposalFixture,
      status: "manual_review" as const,
      decisionReasonCode: "medium_risk" as const,
      decisionReason: "Risco intermediário",
      history: [
        proposalFixture.history[0]!,
        {
          ...proposalFixture.history[1]!,
          toStatus: "manual_review" as const,
          reasonCode: "medium_risk" as const,
          reason: "Risco intermediário",
        },
      ],
    };
    const updated = {
      ...proposal,
      status: "approved" as const,
      decisionReasonCode: "manual_approval" as const,
      decisionReason: "Documentação revisada",
      assignedAnalystId: "507f1f77bcf86cd799439099",
      history: [
        ...proposal.history,
        {
          id: "507f1f77bcf86cd799439099",
          fromStatus: "manual_review" as const,
          toStatus: "approved" as const,
          reasonCode: "manual_approval" as const,
          reason: "Documentação revisada",
          actorType: "analyst" as const,
          actorId: "507f1f77bcf86cd799439099",
          createdAt: "2026-07-29T18:00:00.000Z",
        },
      ],
      updatedAt: "2026-07-29T18:00:00.000Z",
    };
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(updated), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const onDecided = vi.fn();
    renderWithProviders(
      [
        {
          path: "/",
          element: (
            <ManualProposalDecision onDecided={onDecided} proposal={proposal} />
          ),
        },
      ],
      ["/"],
    );

    fireEvent.change(screen.getByLabelText("Justificativa"), {
      target: { value: "Documentação revisada" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Registrar decisão" }));

    expect(
      await screen.findByDisplayValue("Documentação revisada"),
    ).toBeInTheDocument();
    expect(onDecided).toHaveBeenCalledWith(updated);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/proposals/${proposal.id}/decision`,
      expect.objectContaining({ method: "PATCH" }),
    );
  });
});
