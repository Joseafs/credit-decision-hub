import {
  userSchema,
  type User,
  type UserRole,
} from "@credit-decision-hub/contracts";
import type { HydratedDocument } from "mongoose";

import { UserModel, type UserPersistence } from "./user.model.js";

export type UserCredentials = User & { passwordHash: string };
export type UserToCreate = {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
};

const toUser = (document: HydratedDocument<UserPersistence>): User =>
  userSchema.parse({
    id: document._id.toString(),
    name: document.name,
    email: document.email,
    role: document.role,
    active: document.active,
    createdAt: document.createdAt.toISOString(),
  });

export type UserRepository = {
  create(input: UserToCreate): Promise<User>;
  findByEmailWithPassword(email: string): Promise<UserCredentials | null>;
  findById(id: string): Promise<User | null>;
  list(): Promise<User[]>;
};

export const userRepository: UserRepository = {
  async create(input) {
    return toUser(await UserModel.create({ ...input, active: true }));
  },
  async findByEmailWithPassword(email) {
    const user = await UserModel.findOne({ email })
      .select("+passwordHash")
      .exec();
    return user ? { ...toUser(user), passwordHash: user.passwordHash } : null;
  },
  async findById(id) {
    const user = await UserModel.findById(id).exec();
    return user ? toUser(user) : null;
  },
  async list() {
    const users = await UserModel.find().sort({ createdAt: 1 }).exec();
    return users.map(toUser);
  },
};
