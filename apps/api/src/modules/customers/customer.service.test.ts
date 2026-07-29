import type {
  CreateCustomerInput,
  Customer,
} from "@credit-decision-hub/contracts";
import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  CustomerConflictError,
  CustomerNotFoundError,
} from "./customer.errors.js";
import type { CustomerRepository } from "./customer.repository.js";
import { createCustomerService } from "./customer.service.js";

const customerInput: CreateCustomerInput = {
  name: "Maria Oliveira",
  document: "DOC-1001",
  email: "maria@example.com",
  phone: "11999999999",
  monthlyIncome: 8_500,
  occupation: "Analista de dados",
};

const customer: Customer = {
  id: "507f1f77bcf86cd799439011",
  ...customerInput,
  createdAt: "2026-07-29T17:00:00.000Z",
};

const createRepositoryMock = (): CustomerRepository => ({
  create: vi.fn(async () => customer),
  existsByDocumentOrEmail: vi.fn(async () => false),
  findById: vi.fn(async () => customer),
  findPage: vi.fn(async () => ({
    data: [customer],
    total: 1,
  })),
});

describe("customer service", () => {
  let repository: CustomerRepository;

  beforeEach(() => {
    repository = createRepositoryMock();
  });

  test("should create a customer when document and email are available", async () => {
    const service = createCustomerService(repository);

    await expect(service.create(customerInput)).resolves.toEqual(customer);
    expect(repository.existsByDocumentOrEmail).toHaveBeenCalledWith({
      document: customerInput.document,
      email: customerInput.email,
    });
    expect(repository.create).toHaveBeenCalledWith(customerInput);
  });

  test("should reject a customer with an existing document or email", async () => {
    vi.mocked(repository.existsByDocumentOrEmail).mockResolvedValue(true);
    const service = createCustomerService(repository);

    await expect(service.create(customerInput)).rejects.toBeInstanceOf(
      CustomerConflictError,
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  test("should return a paginated customer list", async () => {
    vi.mocked(repository.findPage).mockResolvedValue({
      data: [customer],
      total: 45,
    });
    const service = createCustomerService(repository);

    await expect(service.list({ page: 1, limit: 20 })).resolves.toEqual({
      data: [customer],
      pagination: {
        page: 1,
        limit: 20,
        total: 45,
        totalPages: 3,
      },
    });
  });

  test("should reject a missing customer", async () => {
    vi.mocked(repository.findById).mockResolvedValue(null);
    const service = createCustomerService(repository);

    await expect(service.getById(customer.id)).rejects.toBeInstanceOf(
      CustomerNotFoundError,
    );
  });
});
