import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { renderWithProviders } from "../../test/render";
import { HomePage } from ".";

const componentRender = () =>
  renderWithProviders([{ path: "/", element: <HomePage /> }], ["/"]);

const createHealthResponse = (): Response =>
  new Response(
    JSON.stringify({
      status: "ok",
      service: "credit-decision-api",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

const fetchMock = vi.fn<typeof fetch>();

describe("HomePage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("should show the loading state while checking the API", async () => {
    let resolveRequest: (response: Response) => void = () => undefined;
    const pendingRequest = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });
    fetchMock.mockReturnValue(pendingRequest);

    componentRender();

    expect(screen.getByText("Conectando com a API...")).toBeInTheDocument();

    await act(async () => {
      resolveRequest(createHealthResponse());
      await pendingRequest;
    });
  });

  test("should show success when the API returns a valid health response", async () => {
    fetchMock.mockResolvedValue(createHealthResponse());

    componentRender();

    expect(
      await screen.findByText("Front-end e API conectados"),
    ).toBeInTheDocument();
    expect(screen.getByText("credit-decision-api · ok")).toBeInTheDocument();
  });

  test("should explain the demo API startup when the request takes longer", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(() => new Promise<Response>(() => undefined));

    componentRender();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });

    expect(
      screen.getByText(
        "A API de demonstração está iniciando. Isso pode levar alguns segundos.",
      ),
    ).toBeInTheDocument();
  });

  test("should show an error when the API request fails", async () => {
    fetchMock.mockRejectedValue(new Error("API unavailable"));

    componentRender();

    expect(
      await screen.findByText("Não foi possível acessar a API"),
    ).toBeInTheDocument();
  });

  test("should retry the health check when the form is submitted", async () => {
    fetchMock
      .mockRejectedValueOnce(new Error("API unavailable"))
      .mockResolvedValueOnce(createHealthResponse());

    componentRender();

    await screen.findByText("Não foi possível acessar a API");
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(
      await screen.findByText("Front-end e API conectados"),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
