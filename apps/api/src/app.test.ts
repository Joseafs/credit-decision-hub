import { afterAll, describe, expect, test } from "vitest";

import { buildApp } from "./app.js";

const webOrigin = "https://credit-decision-hub.vercel.app";
const app = buildApp({ corsOrigin: webOrigin });

afterAll(async () => app.close());

describe("application CORS", () => {
  test("should allow credentialed requests for the configured web origin", async () => {
    const response = await app.inject({
      method: "OPTIONS",
      url: "/health",
      headers: {
        origin: webOrigin,
        "access-control-request-method": "GET",
      },
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(webOrigin);
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
  });
});
