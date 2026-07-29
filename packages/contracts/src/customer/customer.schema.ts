import { z } from "zod";

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
  id: z.string().regex(/^[a-f\d]{24}$/i),
  createdAt: z.iso.datetime(),
});

export const customerIdParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i),
});

export const listCustomersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const customerListResponseSchema = z.object({
  data: z.array(customerSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type Customer = z.infer<typeof customerSchema>;
export type CustomerIdParams = z.infer<typeof customerIdParamsSchema>;
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
export type CustomerListResponse = z.infer<typeof customerListResponseSchema>;
