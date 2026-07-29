import {
  createUserSchema,
  userListResponseSchema,
  userSchema,
  type CreateUserInput,
  type User,
} from "@credit-decision-hub/contracts";

import { requestJson } from "./http";

export const listUsers = (): Promise<User[]> =>
  requestJson("/api/users", userListResponseSchema);

export const createAnalyst = (input: CreateUserInput): Promise<User> =>
  requestJson("/api/users", userSchema, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(createUserSchema.parse(input)),
  });
