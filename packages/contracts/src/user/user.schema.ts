import { z } from "zod";

import { entityIdSchema } from "../shared/entity.schema.js";

export const userRoleValues = ["admin", "analyst"] as const;
export const userRoleSchema = z.enum(userRoleValues);

export const userSchema = z
  .object({
    id: entityIdSchema,
    name: z.string().trim().min(3).max(120),
    email: z.string().trim().toLowerCase().email(),
    role: userRoleSchema,
    active: z.boolean(),
    createdAt: z.iso.datetime(),
  })
  .strict();

export const createUserSchema = z
  .object({
    name: z.string().trim().min(3).max(120),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(12).max(128),
    role: z.literal("analyst").default("analyst"),
  })
  .strict();

export const userListResponseSchema = z.array(userSchema);

export type UserRole = z.infer<typeof userRoleSchema>;
export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
