import { setServers } from "node:dns";

import mongoose from "mongoose";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { connectToDatabase, disconnectFromDatabase } from "./mongodb.js";

vi.mock("mongoose", () => ({
  default: {
    connect: vi.fn(),
    disconnect: vi.fn(),
  },
}));

vi.mock("node:dns", () => ({
  setServers: vi.fn(),
}));

describe("MongoDB connection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should connect using the configured database", async () => {
    vi.mocked(mongoose.connect).mockResolvedValue(mongoose);

    await connectToDatabase({
      databaseName: "credit-test",
      dnsServers: ["8.8.8.8", "8.8.4.4"],
      uri: "mongodb://localhost:27017",
    });

    expect(setServers).toHaveBeenCalledWith(["8.8.8.8", "8.8.4.4"]);
    expect(mongoose.connect).toHaveBeenCalledWith("mongodb://localhost:27017", {
      dbName: "credit-test",
      serverSelectionTimeoutMS: 10_000,
    });
  });

  test("should disconnect the active MongoDB connection", async () => {
    vi.mocked(mongoose.disconnect).mockResolvedValue();

    await disconnectFromDatabase();

    expect(mongoose.disconnect).toHaveBeenCalledOnce();
  });
});
