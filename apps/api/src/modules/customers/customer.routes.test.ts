import {
  customerListResponseSchema,
  customerSchema,
  type CreateCustomerInput,
  type Customer,
} from "@credit-decision-hub/contracts";
import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";

import { buildApp } from "../../app.js";
import {
  CustomerConflictError,
  CustomerNotFoundError,
} from "./customer.errors.js";
import type { CustomerService } from "./customer.service.js";

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

const customerService: CustomerService = {
  create: vi.fn(async () => customer),
  getById: vi.fn(async () => customer),
  list: vi.fn(async ({ page, limit }) => ({
    data: [customer],
    pagination: {
      page,
      limit,
      total: 1,
      totalPages: 1,
    },
  })),
};

const app = buildApp({ customerService });

afterAll(async () => {
  await app.close();
});

describe("customer routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should create a customer with a valid payload", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/customers",
      payload: {
        ...customerInput,
        name: "  Maria Oliveira  ",
        email: " MARIA@EXAMPLE.COM ",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(customerSchema.parse(response.json())).toEqual(customer);
    expect(customerService.create).toHaveBeenCalledWith(customerInput);
  });

  test("should reject an invalid customer payload", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/customers",
      payload: {
        ...customerInput,
        monthlyIncome: -1,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      message: "Dados inválidos",
      issues: [
        {
          path: "monthlyIncome",
          message: expect.any(String),
        },
      ],
    });
    expect(customerService.create).not.toHaveBeenCalled();
  });

  test("should return conflict for an existing customer", async () => {
    vi.mocked(customerService.create).mockRejectedValueOnce(
      new CustomerConflictError(),
    );

    const response = await app.inject({
      method: "POST",
      url: "/customers",
      payload: customerInput,
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      message: "Já existe um cliente com este documento ou e-mail",
    });
  });

  test("should list customers with parsed pagination", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/customers?page=2&limit=10",
    });

    expect(response.statusCode).toBe(200);
    expect(customerListResponseSchema.parse(response.json())).toEqual({
      data: [customer],
      pagination: {
        page: 2,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    });
    expect(customerService.list).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
    });
  });

  test("should return a customer by id", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/customers/${customer.id}`,
    });

    expect(response.statusCode).toBe(200);
    expect(customerSchema.parse(response.json())).toEqual(customer);
    expect(customerService.getById).toHaveBeenCalledWith(customer.id);
  });

  test("should return not found for an unknown customer", async () => {
    vi.mocked(customerService.getById).mockRejectedValueOnce(
      new CustomerNotFoundError(),
    );

    const response = await app.inject({
      method: "GET",
      url: `/customers/${customer.id}`,
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      message: "Cliente não encontrado",
    });
  });

  test("should reject an invalid customer id", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/customers/invalid-id",
    });

    expect(response.statusCode).toBe(400);
    expect(customerService.getById).not.toHaveBeenCalled();
  });
});
