import { z } from "zod";

import { userSchema } from "../user/user.schema.js";

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1).max(128),
  })
  .strict();

export const authSessionSchema = z
  .object({
    user: userSchema,
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
