import { z } from "zod";

import { entityIdSchema } from "../shared/entity.schema.js";
import {
  paginationMetadataSchema,
  paginationQuerySchema,
} from "../shared/pagination.schema.js";

const customerFieldsSchema = z.object({
  name: z.string().trim().min(3).max(120),
  document: z.string().trim().min(5).max(30),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().min(8).max(20),
  monthlyIncome: z.number().nonnegative().max(1_000_000_000),
  occupation: z.string().trim().min(2).max(100),
});

export const createCustomerSchema = customerFieldsSchema;

export const customerSchema = customerFieldsSchema.extend({
  id: entityIdSchema,
  createdAt: z.iso.datetime(),
});

export const customerIdParamsSchema = z.object({
  id: entityIdSchema,
});

export const listCustomersQuerySchema = paginationQuerySchema;

export const customerListResponseSchema = z.object({
  data: z.array(customerSchema),
  pagination: paginationMetadataSchema,
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type Customer = z.infer<typeof customerSchema>;
export type CustomerIdParams = z.infer<typeof customerIdParamsSchema>;
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
export type CustomerListResponse = z.infer<typeof customerListResponseSchema>;
