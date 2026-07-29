import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { StatusBadge } from ".";

describe("StatusBadge", () => {
  test("should render its status label", () => {
    render(<StatusBadge tone="success">Aprovada</StatusBadge>);

    expect(screen.getByText("Aprovada")).toBeInTheDocument();
  });
});
