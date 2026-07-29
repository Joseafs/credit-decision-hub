import {
  createCustomerSchema,
  customerListResponseSchema,
  customerSchema,
  type CreateCustomerInput,
  type Customer,
  type CustomerListResponse,
} from "@credit-decision-hub/contracts";

import { requestJson } from "./http";

const CUSTOMER_PAGE_LIMIT = 10;

export const listCustomers = (
  page: number,
  signal?: AbortSignal,
): Promise<CustomerListResponse> =>
  requestJson(
    `/api/customers?page=${page}&limit=${CUSTOMER_PAGE_LIMIT}`,
    customerListResponseSchema,
    signal ? { signal } : undefined,
  );

export const getCustomer = (
  customerId: string,
  signal?: AbortSignal,
): Promise<Customer> =>
  requestJson(
    `/api/customers/${customerId}`,
    customerSchema,
    signal ? { signal } : undefined,
  );

export const createCustomer = (input: CreateCustomerInput): Promise<Customer> =>
  requestJson("/api/customers", customerSchema, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(createCustomerSchema.parse(input)),
  });
