import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { AppPreferencesProvider } from "../../contexts/AppPreferencesContext";
import { AuthProvider } from "../../contexts/AuthContext";
import { LoginPage } from ".";

const fetchMock = vi.fn<typeof fetch>();

const componentRender = () => {
  const router = createMemoryRouter(
    [
      { path: "/", element: <p>Área protegida</p> },
      { path: "/login", element: <LoginPage /> },
    ],
    { initialEntries: ["/login"] },
  );
  return render(
    <AppPreferencesProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </AppPreferencesProvider>,
  );
};

describe("LoginPage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  test("should authenticate and navigate to the protected area", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Authentication required" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user: {
              id: "507f1f77bcf86cd799439011",
              name: "Analista Demo",
              email: "analyst@example.test",
              role: "analyst",
              active: true,
              createdAt: "2026-07-29T12:00:00.000Z",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    componentRender();

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "analyst@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "demo-password-123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Área protegida")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/auth/login",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      }),
    );
  });
});
