import {
  customerListResponseSchema,
  type CreateCustomerInput,
  type Customer,
  type CustomerListResponse,
  type ListCustomersQuery,
} from "@credit-decision-hub/contracts";

import {
  CustomerConflictError,
  CustomerNotFoundError,
} from "./customer.errors.js";
import type { CustomerRepository } from "./customer.repository.js";

export type CustomerService = {
  create(input: CreateCustomerInput): Promise<Customer>;
  getById(id: string): Promise<Customer>;
  list(query: ListCustomersQuery): Promise<CustomerListResponse>;
};

export const createCustomerService = (
  repository: CustomerRepository,
): CustomerService => ({
  async create(input) {
    const customerExists = await repository.existsByDocumentOrEmail({
      document: input.document,
      email: input.email,
    });

    if (customerExists) {
      throw new CustomerConflictError();
    }

    return repository.create(input);
  },

  async getById(id) {
    const customer = await repository.findById(id);

    if (!customer) {
      throw new CustomerNotFoundError();
    }

    return customer;
  },

  async list(query) {
    const page = await repository.findPage(query);

    return customerListResponseSchema.parse({
      data: page.data,
      pagination: {
        ...query,
        total: page.total,
        totalPages: Math.ceil(page.total / query.limit),
      },
    });
  },
});
