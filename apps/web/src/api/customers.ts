import {
  createCustomerSchema,
  customerListResponseSchema,
  customerSchema,
  listCustomersQuerySchema,
  type CreateCustomerInput,
  type Customer,
  type CustomerListResponse,
  type ListCustomersQuery,
} from "@credit-decision-hub/contracts";

import { requestJson } from "./http";

const CUSTOMER_PAGE_LIMIT = 10;

export const parseCustomerListQuery = (
  searchParams: URLSearchParams,
): ListCustomersQuery => {
  const query = Object.fromEntries(searchParams);

  return listCustomersQuerySchema.strict().parse({
    ...query,
    limit: query.limit ?? CUSTOMER_PAGE_LIMIT,
  });
};

export const serializeCustomerListQuery = (
  input: ListCustomersQuery,
): URLSearchParams => {
  const query = listCustomersQuerySchema.parse(input);
  const searchParams = new URLSearchParams();

  if (query.page > 1) {
    searchParams.set("page", String(query.page));
  }

  if (query.limit !== CUSTOMER_PAGE_LIMIT) {
    searchParams.set("limit", String(query.limit));
  }

  return searchParams;
};

export const listCustomers = (
  input: ListCustomersQuery,
  signal?: AbortSignal,
): Promise<CustomerListResponse> => {
  const query = listCustomersQuerySchema.parse(input);
  const searchParams = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  });

  return requestJson(
    `/api/customers?${searchParams.toString()}`,
    customerListResponseSchema,
    signal ? { signal } : undefined,
  );
};

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
