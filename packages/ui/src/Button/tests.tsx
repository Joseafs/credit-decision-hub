import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { Button } from ".";

describe("Button", () => {
  test("should call the provided action when clicked", () => {
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Continuar</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(handleClick).toHaveBeenCalledOnce();
  });

  test("should prevent interaction when disabled", () => {
    const handleClick = vi.fn();

    render(
      <Button disabled onClick={handleClick}>
        Indisponível
      </Button>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Indisponível" }));

    expect(handleClick).not.toHaveBeenCalled();
  });
});
