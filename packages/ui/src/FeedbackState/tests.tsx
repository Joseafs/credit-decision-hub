import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { FeedbackState } from ".";

describe("FeedbackState", () => {
  test("should announce neutral feedback as a status", () => {
    render(
      <FeedbackState
        description="A consulta está em andamento."
        title="Carregando"
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "CarregandoA consulta está em andamento.",
    );
  });

  test("should announce dangerous feedback as an alert with an action", () => {
    render(
      <FeedbackState
        action={<button type="button">Tentar novamente</button>}
        title="Falha na consulta"
        tone="danger"
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tentar novamente" }),
    ).toBeInTheDocument();
  });
});
