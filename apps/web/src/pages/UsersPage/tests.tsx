import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { renderWithProviders } from "../../test/render";
import { UsersPage } from ".";

const fetchMock = vi.fn<typeof fetch>();
const admin = {
  id: "507f1f77bcf86cd799439011",
  name: "Admin Demo",
  email: "admin@example.test",
  role: "admin",
  active: true,
  createdAt: "2026-07-29T12:00:00.000Z",
};

describe("UsersPage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  test("should list users and create an analyst", async () => {
    const analyst = {
      ...admin,
      id: "507f1f77bcf86cd799439012",
      name: "Analista Demo",
      email: "analyst@example.test",
      role: "analyst",
    };
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify([admin]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(analyst), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      );
    renderWithProviders([{ path: "/", element: <UsersPage /> }], ["/"]);

    expect(await screen.findByText("Admin Demo")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: analyst.name },
    });
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: analyst.email },
    });
    fireEvent.change(screen.getByLabelText("Senha temporária"), {
      target: { value: "demo-password-123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar analista" }));

    expect(await screen.findByText("Analista Demo")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/users",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
