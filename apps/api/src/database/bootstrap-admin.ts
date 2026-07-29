import { z } from "zod";

import { loadEnvironmentFiles, readEnvironment } from "../config/env.js";
import { connectToDatabase, disconnectFromDatabase } from "./mongodb.js";
import { hashPassword } from "../modules/users/password.js";
import { UserModel } from "../modules/users/user.model.js";

const bootstrapSchema = z.object({
  AUTH_BOOTSTRAP_NAME: z.string().trim().min(3).max(120),
  AUTH_BOOTSTRAP_EMAIL: z.string().trim().toLowerCase().email(),
  AUTH_BOOTSTRAP_PASSWORD: z.string().min(12).max(128),
});

const bootstrapAdmin = async (): Promise<void> => {
  loadEnvironmentFiles();
  const environment = readEnvironment();
  const input = bootstrapSchema.parse(process.env);

  await connectToDatabase({
    databaseName: environment.mongodbDatabase,
    dnsServers: environment.dnsServers,
    uri: environment.mongodbUri,
  });

  try {
    if (await UserModel.exists({ role: "admin" })) {
      throw new Error("Já existe um administrador; bootstrap cancelado");
    }
    await UserModel.create({
      name: input.AUTH_BOOTSTRAP_NAME,
      email: input.AUTH_BOOTSTRAP_EMAIL,
      passwordHash: await hashPassword(input.AUTH_BOOTSTRAP_PASSWORD),
      role: "admin",
      active: true,
    });
    console.info("Administrador inicial criado com sucesso");
  } finally {
    await disconnectFromDatabase();
  }
};

void bootstrapAdmin();
