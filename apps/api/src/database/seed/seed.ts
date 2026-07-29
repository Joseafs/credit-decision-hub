import mongoose from "mongoose";

import { loadEnvironmentFiles, readEnvironment } from "../../config/env.js";
import { CustomerModel } from "../../modules/customers/customer.model.js";
import { ProposalModel } from "../../modules/proposals/proposal.model.js";
import { connectToDatabase, disconnectFromDatabase } from "../mongodb.js";
import { readSeedConfig } from "./seed.config.js";
import { createDemoSeedData } from "./seed.data.js";

const runSeed = async (): Promise<void> => {
  loadEnvironmentFiles();

  const environment = readEnvironment();
  const config = readSeedConfig(environment.mongodbDatabase);
  const data = createDemoSeedData(config);

  try {
    await connectToDatabase({
      databaseName: environment.mongodbDatabase,
      dnsServers: environment.dnsServers,
      uri: environment.mongodbUri,
    });

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const seedFilter = { seedKey: config.seedKey };

        await ProposalModel.deleteMany(seedFilter, { session });
        await CustomerModel.deleteMany(seedFilter, { session });
        await CustomerModel.insertMany(data.customers, { session });
        await ProposalModel.insertMany(data.proposals, { session });
      });
    } finally {
      await session.endSession();
    }

    console.info(
      [
        "Seed concluído com dados integralmente fictícios.",
        `Banco confirmado: ${config.databaseName}`,
        `Clientes: ${data.customers.length}`,
        `Propostas: ${data.proposals.length}`,
        `Período: ${data.startDate.toISOString()} a ${data.referenceDate.toISOString()}`,
      ].join("\n"),
    );
  } finally {
    await disconnectFromDatabase();
  }
};

void runSeed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
