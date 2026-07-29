import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { renderWithProviders } from "../../test/render";
import { AppHeader } from ".";

const componentRender = () =>
  renderWithProviders([{ path: "/", element: <AppHeader /> }], ["/"]);

describe("AppHeader", () => {
  test("should switch the complete navigation language to English", async () => {
    window.localStorage.setItem("cdh-locale", "pt-BR");
    componentRender();

    fireEvent.click(screen.getByRole("button", { name: "EN" }));

    expect(screen.getByRole("link", { name: "Customers" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Proposals" })).toBeInTheDocument();
    await waitFor(() => {
      expect(document.documentElement.lang).toBe("en");
    });
    expect(window.localStorage.getItem("cdh-locale")).toBe("en");
  });

  test("should switch and persist the selected color theme", async () => {
    window.localStorage.setItem("cdh-theme", "dark");
    componentRender();

    fireEvent.click(screen.getByRole("button", { name: "Ativar tema claro" }));

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe("light");
    });
    expect(window.localStorage.getItem("cdh-theme")).toBe("light");
  });
});
