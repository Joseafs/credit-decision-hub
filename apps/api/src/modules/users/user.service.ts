import type {
  CreateUserInput,
  LoginInput,
  User,
} from "@credit-decision-hub/contracts";
import { userSchema } from "@credit-decision-hub/contracts";

import { InvalidCredentialsError, UserConflictError } from "./user.errors.js";
import { hashPassword, verifyPassword } from "./password.js";
import type { UserRepository } from "./user.repository.js";

export type UserService = {
  authenticate(input: LoginInput): Promise<User>;
  createAnalyst(input: CreateUserInput): Promise<User>;
  getActiveById(id: string): Promise<User | null>;
  list(): Promise<User[]>;
};

export const createUserService = (repository: UserRepository): UserService => ({
  async authenticate(input) {
    const credentials = await repository.findByEmailWithPassword(input.email);
    if (
      !credentials?.user.active ||
      !(await verifyPassword(input.password, credentials.passwordHash))
    ) {
      throw new InvalidCredentialsError();
    }
    return userSchema.parse(credentials.user);
  },
  async createAnalyst(input) {
    try {
      return await repository.create({
        name: input.name,
        email: input.email,
        role: "analyst",
        passwordHash: await hashPassword(input.password),
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
      ) {
        throw new UserConflictError();
      }
      throw error;
    }
  },
  async getActiveById(id) {
    const user = await repository.findById(id);
    return user?.active ? user : null;
  },
  list: () => repository.list(),
});
