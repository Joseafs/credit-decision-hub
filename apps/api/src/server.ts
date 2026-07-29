import { buildApp } from "./app.js";
import { loadEnvironmentFiles, readEnvironment } from "./config/env.js";
import {
  connectToDatabase,
  disconnectFromDatabase,
} from "./database/mongodb.js";

const startServer = async (): Promise<void> => {
  const app = buildApp({ logger: true });

  try {
    loadEnvironmentFiles();
    const environment = readEnvironment();

    await connectToDatabase({
      databaseName: environment.mongodbDatabase,
      dnsServers: environment.dnsServers,
      uri: environment.mongodbUri,
    });
    app.log.info(
      { database: environment.mongodbDatabase },
      "MongoDB connection established",
    );

    await app.listen({ host: "0.0.0.0", port: environment.port });
  } catch (error) {
    app.log.error(error);
    await disconnectFromDatabase();
    process.exitCode = 1;
  }
};

void startServer();
